

# app.py
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, render_template
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
import pandas as pd
import numpy as np
import traceback
from utils import get_si_flow_rate
import os

# --- Import calculation and helper files ---
from thermal_solver import solve_thermal_balance
from kern_calculator import calculate_all_performance
from bell_delaware_calculator import calculate_bell_delaware_htc, calculate_flow_fractions, get_common_bd_params,calculate_bell_delaware_dp
from file_handler import find_property_label

# --- Comprehensive Material Definitions ---

# This dictionary holds all materials that have a thermal conductivity value.
MATERIAL_PROPERTIES = {
    # Carbon & Low Alloy Steels
    "Carbon Steel": 52.0,
    "Low Alloy Steel": 45.0,

    # Stainless Steels
    "SS304 / 304L": 16.2,
    "SS316 / 316L": 16.2,
    "Duplex Stainless Steel": 15.0,

    # Copper Alloys
    "Copper": 401.0,
    "Admiralty Brass": 110.0,
    "Aluminium Brass": 100.0,
    "Naval Brass": 115.0,
    "Muntz Metal": 125.0,
    "Copper-Nickel (90/10)": 40.0,
    "Copper-Nickel (70/30)": 29.0,
    "Brass": 120.0,

    # High Performance Alloys
    "Titanium": 22.0,
    "Monel 400": 22.0,
    "Inconel 625": 10.0,
    
    # Clad material (conductivity is complex, not used in calc, but good for list)
    "Clad Steel (CS-SS)": 52.0 # Note: Using CS value as a placeholder
}

MATERIAL_NAMES = sorted(list(MATERIAL_PROPERTIES.keys()))


# This list contains all possible gasket materials.
GASKET_MATERIALS = [
    "CNAF",
    "Flexible Graphite",
    "PTFE",
    "Spiral Wound - Graphite Filled",
    "Spiral Wound - PTFE Filled"
]

# This list contains all possible bolting materials.
BOLTING_MATERIALS = [
    "A193 B7 / A194 2H",  # Standard CS
    "A193 B8 / A194 8",    # 304 SS
    "A193 B8M / A194 8M",  # 316 SS
    "A320 L7 / A194 7"     # Low Temp CS
]

# --- Initialize Flask App and Load Data ---
app = Flask(__name__)

# --- Configuration for Database and Session ---
# Reads the database URL and secret key from Render's environment variables
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace("postgres://", "postgresql://", 1)
# Use a local SQLite database for testing
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///test.db')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key-for-local-dev')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = "You must be logged in to access this page."


# --- User Model with Admin Role ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# # IMPORTANT: Set a secret key for session management. Change this to a random string.
# app.config['SECRET_KEY'] = 'a-very-secret-and-random-string' 

# # --- Database Setup ---
# basedir = os.path.abspath(os.path.dirname(__file__))
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)

# # --- Login Manager Setup ---
# login_manager = LoginManager()
# login_manager.init_app(app)
# # If a user tries to access a protected page without being logged in,
# # redirect them to the login page.
# login_manager.login_view = 'login'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    fluid_data_path = os.path.join(BASE_DIR, 'fluids_data.csv')
    fluid_data = pd.read_csv(fluid_data_path)
    fluid_data.columns = ['fluid_name', 'temperature', 'viscosity', 'cp', 'conductivity', 'density']
    print("✅ Fluid properties database loaded successfully.")
except FileNotFoundError:
    print(f"❌ FATAL ERROR: 'fluids_data.csv' not found at {fluid_data_path}")
    fluid_data = pd.DataFrame()

try:
    pipe_schedule_headers = ['nps', 'dn', 'od_mm', 'sch_5s', 'sch_10s', 'sch_10', 'sch_20', 'sch_30', 'sch_40s', 'sch_std', 'sch_40', 'sch_60', 'sch_80s', 'sch_xs', 'sch_80', 'sch_100', 'sch_120', 'sch_140', 'sch_160', 'sch_xxs', 'dummy21', 'dummy22', 'dummy23']
    pipe_schedule_path = os.path.join(BASE_DIR, 'pipe_schedule.csv')
    pipe_schedule_data = pd.read_csv(pipe_schedule_path, skiprows=1, names=pipe_schedule_headers, engine='python')
    print("✅ Pipe schedule database loaded successfully.")
except Exception as e:
    print(f"❌ FATAL ERROR: 'pipe_schedule.csv' not found or is invalid. Error: {e}")
    pipe_schedule_data = pd.DataFrame()


# --- Helper Functions ---

# START: REPLACE THE BODY OF THIS FUNCTION
def convert_nan_to_none(data):
    """
    Recursively traverses a data structure to convert non-JSON-serializable
    types (like NaN, numpy.int64, numpy.float64) into JSON-safe types
    (None, int, float), while keeping the original function name.
    """
    # Handles dictionaries by recursively calling itself on values
    if isinstance(data, dict):
        return {k: convert_nan_to_none(v) for k, v in data.items()}
    # Handles lists by recursively calling itself on items
    if isinstance(data, list):
        return [convert_nan_to_none(item) for item in data]
    
    # IMPORTANT: Check for NaN first, as it's a special float type
    if pd.isna(data):
        return None
        
    # NEW: Convert NumPy integer types (like int64) to standard Python int
    if isinstance(data, np.integer):
        return int(data)
        
    # NEW: Convert NumPy float types (like float64) to standard Python float
    if isinstance(data, np.floating):
        return float(data)
        
    # NEW: Convert NumPy boolean types to standard Python bool
    if isinstance(data, np.bool_):
        return bool(data)
        
    # Return the original value if it's already a safe type (str, regular int/float, etc.)
    return data
# END: REPLACEMENT OF FUNCTION BODY



# In app.py

def get_fluid_properties(fluid_name, temp):
    temp = float(temp)
    if 'water' in fluid_name.lower():
        # Water logic is fine, it already uses cP.
        temp_pts = [25, 40]; den_pts = [997.0, 992.2]; visc_pts = [0.89, 0.653]; cp_pts = [4.186, 4.179]; k_pts = [0.607, 0.631]
        density = np.interp(temp, temp_pts, den_pts); viscosity = np.interp(temp, temp_pts, visc_pts)
        cp = np.interp(temp, temp_pts, cp_pts); k = np.interp(temp, temp_pts, k_pts)
        
        # We don't need to modify the return for water as its values are already in cP.
        return {'density': round(density, 2), 'viscosity': round(viscosity, 3), 'cp': round(cp, 3), 'conductivity': round(k, 3)}

    else:
        if fluid_data.empty: return {}
        oil_df = fluid_data[fluid_data['fluid_name'].str.lower() == fluid_name.lower()]
        
        if oil_df.empty: return {}
        
        density = np.interp(temp, oil_df['temperature'], oil_df['density'])
        
        ### --- THIS IS THE FIX --- ###
        # The CSV stores oil viscosity in Pa.s. We must convert it to cP.
        # 1 Pa.s = 1000 cP.
        # viscosity_pas = np.interp(temp, oil_df['temperature'], oil_df['viscosity'])
        # viscosity = viscosity_pas * 1000  # Convert to cP
        viscosity_pas = np.interp(temp, oil_df['temperature'], oil_df['viscosity'])
        viscosity = viscosity_pas * 1000  # Convert to cP

        cp = np.interp(temp, oil_df['temperature'], oil_df['cp'])
        k = np.interp(temp, oil_df['temperature'], oil_df['conductivity'])
        
        # Now, the returned viscosity will be in the correct cP unit.
        return {'density': round(density, 2), 'viscosity': round(viscosity, 3), 'cp': round(cp, 3), 'conductivity': round(k, 3)}


def to_num(val): return pd.to_numeric(val, errors='coerce')



def create_dataframe_from_json(data):
    """
    Creates the master DataFrame for the thermal solver.
    This robust version calculates bulk properties on the backend and
    now accepts pre-converted SI units for fouling factor from the frontend.
    """
    # --- 1. Extract primary inputs and convert to numeric ---
    t_hot_in = to_num(data.get('shell_inlet_temp'))
    t_hot_out = to_num(data.get('shell_outlet_temp'))
    t_cold_in = to_num(data.get('tube_inlet_temp'))
    t_cold_out = to_num(data.get('tube_outlet_temp'))

    # --- 2. Calculate Bulk Temperatures ---
    bulk_temp_hot = (t_hot_in + t_hot_out) / 2 if pd.notna(t_hot_in) and pd.notna(t_hot_out) else t_hot_in
    bulk_temp_cold = (t_cold_in + t_cold_out) / 2 if pd.notna(t_cold_in) and pd.notna(t_cold_out) else t_cold_in

    if pd.isna(bulk_temp_hot) or pd.isna(bulk_temp_cold):
        print("Error: Cannot proceed without at least inlet temperatures.")
        return None 

    # --- 3. Fetch Fluid Properties at Bulk Temperatures ---
    hot_fluid_name = data.get('shell_fluid_name')
    cold_fluid_name = data.get('tube_fluid_name')
    hot_props = get_fluid_properties(hot_fluid_name, bulk_temp_hot)
    cold_props = get_fluid_properties(cold_fluid_name, bulk_temp_cold)

    if not hot_props or not cold_props:
        print(f"Error: Could not fetch backend properties for {hot_fluid_name} or {cold_fluid_name}.")
        return None

    # --- 4. Handle Fouling Factor ---
    # **CRITICAL CHANGE**: The conversion is now done on the frontend.
    # The backend simply accepts the SI value (m²K/W) it is given.
    shell_ff_si = to_num(data.get('shell_fouling'))
    tube_ff_si = to_num(data.get('tube_fouling'))

    # --- 5. Assemble the DataFrame for the solver ---
    d = {'Property Name': ['Flow Rate (m3/s)', 'Inlet Temp (C)', 'Outlet Temp (C)', 'Heat Load (kW)', 
                           'Density (kg/m3)', 'Sp.Heat Cap (kJ/kg.K)', 'Thermal Conductivity (W/m.K)', 
                           'Viscosity (cP)', 'Fouling Factor (m2.K/W)'],
         'Hot Fluid': [
             to_num(data.get('shell_flowrate')), t_hot_in, t_hot_out, to_num(data.get('heat_load')),
             hot_props.get('density'), hot_props.get('cp'), hot_props.get('conductivity'), hot_props.get('viscosity'),
             shell_ff_si # Use the value directly from frontend
         ],
         'Cold Fluid': [
             to_num(data.get('tube_flowrate')), t_cold_in, t_cold_out, to_num(data.get('heat_load')),
             cold_props.get('density'), cold_props.get('cp'), cold_props.get('conductivity'), cold_props.get('viscosity'),
             tube_ff_si # Use the value directly from frontend
         ]}
    
    return pd.DataFrame(d).set_index('Property Name')



# --- Authentication Routes ---

# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if current_user.is_authenticated:
#         return redirect(url_for('customer_page'))
    
#     # ... (your form processing logic here) ...

#     # Render the new login page template
#     return render_template('login.html') 

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('customer_page'))
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form.get('username')).first()
        if user and user.check_password(request.form.get('password')):
            login_user(user)
            return redirect(url_for('customer_page'))
        else:
            flash('Invalid username or password.', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    # SPECIAL LOGIC: The first user to ever register becomes the admin.
    has_users = User.query.first() is not None
    
    if current_user.is_authenticated: return redirect(url_for('thermal_page'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'warning')
            return redirect(url_for('register'))

        # If no users exist in the DB, make this new user an admin.
        is_first_user = not has_users
        new_user = User(username=username, is_admin=is_first_user)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        if is_first_user:
            flash('Congratulations! You have created the first Admin account. You can now log in.', 'success')
        else:
            # This part should ideally not be reachable if registration is locked down.
            flash('Account created successfully! You can now log in.', 'success')

        return redirect(url_for('login'))

    # Pass the 'has_users' flag to the template.
    # The template will hide the form if it's not the first registration.
    return render_template('register.html', has_users=has_users)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


# --- Admin User Management Routes ---

@app.route('/admin/users')
@login_required
def manage_users():
    # Only allow access if the current user is an admin
    if not current_user.is_admin:
        flash("You do not have permission to access this page.", "danger")
        return redirect(url_for('thermal_page'))
        
    all_users = User.query.order_by(User.id).all()
    return render_template('manage_users.html', users=all_users)

@app.route('/admin/users/create', methods=['POST'])
@login_required
def create_user():
    if not current_user.is_admin: return redirect(url_for('thermal_page'))
    
    username = request.form.get('username')
    password = request.form.get('password')
    is_admin = request.form.get('is_admin') == 'on' # Checkbox value

    if not username or not password:
        flash("Username and password are required.", "warning")
        return redirect(url_for('manage_users'))

    if User.query.filter_by(username=username).first():
        flash("Username already exists.", "warning")
        return redirect(url_for('manage_users'))
        
    new_user = User(username=username, is_admin=is_admin)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    flash(f"User '{username}' created successfully.", "success")
    return redirect(url_for('manage_users'))

@app.route('/admin/users/delete/<int:user_id>', methods=['POST'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin: return redirect(url_for('thermal_page'))
    
    user_to_delete = User.query.get_or_404(user_id)
    
    # Prevent the admin from deleting their own account
    if user_to_delete.id == current_user.id:
        flash("You cannot delete your own account.", "danger")
        return redirect(url_for('manage_users'))
        
    db.session.delete(user_to_delete)
    db.session.commit()
    flash(f"User '{user_to_delete.username}' has been deleted.", "success")
    return redirect(url_for('manage_users'))




# --- Page Rendering Routes ---
# @app.route('/')
# def customer_page(): # The root now serves the customer page
#     return render_template('customer.html')

@app.route('/')
def home_page():
    if current_user.is_authenticated:
        return redirect(url_for('customer_page'))
    return redirect(url_for('login'))

# In app.py, add this function along with your other @app.route functions

@app.route('/customer')
@login_required
def customer_page():
    # Assuming you have a customer.html template
    return render_template('customer.html')

@app.route('/thermal') # The thermal page is now at /thermal
@login_required
def thermal_page():
    oil_names = []
    if not fluid_data.empty: 
        
        # oil_names = sorted(fluid_data['fluid_name'].unique().tolist())
        oil_names = fluid_data['fluid_name'].unique().tolist()
    return render_template('thermal.html', fluid_names=oil_names)


@app.route('/geometry')
@login_required

def geometry_page(): return render_template('geometry.html')




@app.route('/materials')
@login_required

def materials_page():
    material_names = list(MATERIAL_PROPERTIES.keys())
    # Pass all three lists to the template
    return render_template(
        'materials.html', 
        material_names=material_names,
        gasket_materials=GASKET_MATERIALS,
        bolting_materials=BOLTING_MATERIALS
    )



# ... (The rest of the routes remain the same: /geometry, /materials, etc.)

@app.route('/nozzles')
@login_required
def nozzles_page(): return render_template('nozzles.html')


# This is the old report page, now the "Web Report"
@app.route('/web-report')
@login_required
def report_page(): 
    return render_template('report.html')

# This is the new final TEMA Datasheet page
@app.route('/datasheet')
@login_required
def datasheet_page():
    return render_template('datasheet.html')


# --- Database Initialization Command ---
# This is a helper command to create the tables in the database.
# You will run this once from the Render shell.
@app.cli.command("init-db")
def init_db_command():
    """Creates the database tables."""
    db.create_all()
    print("Initialized the database.")

# --- API Endpoints ---
@app.route('/api/fluid-properties')
def api_get_fluid_properties():
    fluid_name = request.args.get('fluid_name', 'Water')
    temp = request.args.get('temp', 25.0)
    properties = get_fluid_properties(fluid_name, temp)
    if not properties: return jsonify({"error": f"Fluid properties not found for {fluid_name}"}), 404
    return jsonify(properties)
@app.route('/api/pipe-schedules')
def api_pipe_schedules():
    if pipe_schedule_data.empty: return jsonify({"error": "Pipe schedule data not available on server."}), 500
    df_cleaned = pipe_schedule_data.replace({np.nan: None})
    records = df_cleaned.to_dict(orient='records')
    return jsonify(records)

@app.route('/api/solve-thermal-balance', methods=['POST'])
def api_solve_thermal():
    try:
        data = request.get_json()
        df_initial = create_dataframe_from_json(data)
        df_solved = solve_thermal_balance(df_initial)
        if df_solved is None: return jsonify({"error": "Could not solve the thermal balance."}), 400
        data['shell_outlet_temp'] = df_solved.loc[find_property_label(df_solved.index, 'Outlet Temp'), 'Hot Fluid']
        data['tube_outlet_temp'] = df_solved.loc[find_property_label(df_solved.index, 'Outlet Temp'), 'Cold Fluid']
        data['heat_load'] = df_solved.loc[find_property_label(df_solved.index, 'Heat Load'), 'Hot Fluid']
        data['shell_flowrate'] = df_solved.loc[find_property_label(df_solved.index, 'Flow Rate'), 'Hot Fluid']
        data['tube_flowrate'] = df_solved.loc[find_property_label(df_solved.index, 'Flow Rate'), 'Cold Fluid']
        t_hot_in = to_num(data['shell_inlet_temp']); t_hot_out = to_num(data['shell_outlet_temp'])
        t_cold_in = to_num(data['tube_inlet_temp']); t_cold_out = to_num(data['tube_outlet_temp'])
        # Calculate bulk and wall temps, then ROUND them for display
        bulk_temp_hot_val = (t_hot_in + t_hot_out) / 2
        bulk_temp_cold_val = (t_cold_in + t_cold_out) / 2
        data['shell_flowrate'] = round(data['shell_flowrate'],6)
        data['tube_flowrate'] = round(data['tube_flowrate'],6)
        data['heat_load'] = round(data['heat_load'],3)

        data['bulk_temp_hot'] = round(bulk_temp_hot_val, 3)
        data['bulk_temp_cold'] = round(bulk_temp_cold_val, 3)
        data['wall_temp'] = round((bulk_temp_hot_val + bulk_temp_cold_val) / 2, 3)

        return jsonify(convert_nan_to_none(data))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An internal error occurred: {e}"}), 500

@app.route('/api/calculate-performance', methods=['POST'])
def api_calculate_performance():
    try:
        data = request.get_json()
        thermal_data = data.get('thermal')
        geo_data = data.get('geometry')
        df_final = create_dataframe_from_json(thermal_data)
        geo_props = {key: to_num(value) if key not in ['front_head_type', 'shell_type', 'rear_head_type', 'tube_layout', 'orientation'] else value for key, value in geo_data.items()}
        geo_props['tube_outer_diameter'] = geo_props.pop('tube_od', None)
        geo_props['number_of_tubes'] = geo_props.pop('num_tubes', None)
        geo_props['number_of_passes'] = geo_props.pop('num_passes', None)
        t_wall_approx = to_num(thermal_data.get('wall_temp'))
        tube_fluid_name = thermal_data.get('tube_fluid_name', 'Water')
        mu_bulk_cp = df_final.loc[find_property_label(df_final.index, 'Viscosity'), 'Cold Fluid']
        wall_props = get_fluid_properties(tube_fluid_name, t_wall_approx)
        tube_viscosities = {'bulk': mu_bulk_cp, 'wall': wall_props.get('viscosity')}
        # kern_results = calculate_all_performance(df_final, geo_props, tube_viscosities, calc_U=False, calc_dP=False)
        # bd_htc = calculate_bell_delaware_htc(df_final, geo_props)

                # FIX: Pass `thermal_data` dictionary to the calculator functions
        kern_results = calculate_all_performance(df_final, geo_props, tube_viscosities, thermal_data, calc_U=False, calc_dP=False)
        bd_htc = calculate_bell_delaware_htc(df_final, geo_props, thermal_data)

        final_results = {
            "tube_side": { "reynolds": kern_results.get('Tube-Side Reynolds No.'), "prandtl": kern_results.get('Tube-Side Prandtl No.'), "htc": kern_results.get('Tube-Side h (W/m2.K)') },
            "kern_method": { "reynolds": kern_results.get('Shell-Side Reynolds No. (Kern)'), "prandtl": kern_results.get('Shell-Side Prandtl No.'), "htc": kern_results.get('Shell-Side h (Kern Method) (W/m2.K)') },
            "bell_delaware_method": { "htc": bd_htc }
        }
        return jsonify(convert_nan_to_none(final_results))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred."}), 500






# In app.py

@app.route('/api/calculate-final-performance', methods=['POST'])
def api_calculate_final_performance():
    try:
        data = request.get_json()
        thermal_data = data.get('thermal'); geo_data = data.get('geometry'); material_data = data.get('materials'); nozzle_data = data.get('nozzles')

        # --- 1. GET SHELL CONFIGURATION ---
        N_series = int(to_num(geo_data.get('shells_in_series', 1)))
        N_parallel = int(to_num(geo_data.get('shells_in_parallel', 1)))
        if N_series == 0: N_series = 1
        if N_parallel == 0: N_parallel = 1

        # --- 2. CREATE A "PER-SHELL" DATAFRAME for calculations ---
        # Create a mutable copy of thermal_data to adjust flow rates for parallel shells.
        thermal_data_per_shell = thermal_data.copy()
        if N_parallel > 1:
            print(f"-> Parallel shells detected ({N_parallel}). Adjusting flow rates for per-shell calculation.")
            shell_flow = to_num(thermal_data['shell_flowrate']) / N_parallel
            tube_flow = to_num(thermal_data['tube_flowrate']) / N_parallel
            thermal_data_per_shell['shell_flowrate'] = str(shell_flow)
            thermal_data_per_shell['tube_flowrate'] = str(tube_flow)
        
        # All underlying calculations will use this per-shell dataframe
        df_per_shell = create_dataframe_from_json(thermal_data_per_shell)

        # --- 3. PREPARE GEOMETRY AND RUN PER-SHELL CALCULATIONS ---
        geo_props = {key: to_num(value) if key not in ['front_head_type', 'shell_type', 'rear_head_type', 'tube_layout', 'orientation'] else value for key, value in geo_data.items()}
        geo_props['tube_outer_diameter'] = geo_props.pop('tube_od', None)
        geo_props['number_of_tubes'] = geo_props.pop('num_tubes', None)
        geo_props['number_of_passes'] = geo_props.pop('num_passes', None)
        geo_props['tube_material_conductivity'] = MATERIAL_PROPERTIES.get(material_data.get('mat_tube'), 50.0)


        t_wall = to_num(thermal_data.get('wall_temp')); tube_fluid_name = thermal_data.get('tube_fluid_name', 'Water')
        mu_bulk_cp = df_per_shell.loc[find_property_label(df_per_shell.index, 'Viscosity'), 'Cold Fluid']
        wall_props = get_fluid_properties(tube_fluid_name, t_wall); tube_viscosities = {'bulk': mu_bulk_cp, 'wall': wall_props.get('viscosity')}

        temp_geo_props_for_calc = geo_props.copy()
        temp_geo_props_for_calc['shell_nozzle_diameter'] = to_num(nozzle_data.get('shell', {}).get('inlet', {}).get('id_mm'))
        temp_geo_props_for_calc['tube_nozzle_diameter'] = to_num(nozzle_data.get('tube', {}).get('inlet', {}).get('id_mm'))

                # --- FIX: Pass `thermal_data_per_shell` dictionary to ALL calculator calls ---
        kern_results_per_shell = calculate_all_performance(df_per_shell, temp_geo_props_for_calc, tube_viscosities, thermal_data_per_shell, calc_U=False, calc_dP=True)
        bd_htc_per_shell = calculate_bell_delaware_htc(df_per_shell, geo_props, thermal_data_per_shell)
        bd_common_params = get_common_bd_params(df_per_shell, geo_props, thermal_data_per_shell)
        flow_fractions = calculate_flow_fractions(bd_common_params, geo_props)
        bd_dp_per_shell = calculate_bell_delaware_dp(df_per_shell, geo_props, nozzle_data, thermal_data_per_shell)


        
        # kern_results_per_shell = calculate_all_performance(df_per_shell, temp_geo_props_for_calc, tube_viscosities, calc_U=False, calc_dP=True)
        # bd_htc_per_shell = calculate_bell_delaware_htc(df_per_shell, geo_props)
        # bd_common_params = get_common_bd_params(df_per_shell, geo_props)
        # flow_fractions = calculate_flow_fractions(bd_common_params, geo_props)
        # bd_dp_per_shell = calculate_bell_delaware_dp(df_per_shell, geo_props, nozzle_data)
        
        # --- 4. ASSEMBLE FINAL SYSTEM-WIDE RESULTS ---
        final_results = {}

        # a) Assemble U-Values (these are per-shell and don't change)
        h_cold = kern_results_per_shell.get('Tube-Side h (W/m2.K)'); h_hot_kern = kern_results_per_shell.get('Shell-Side h (Kern Method) (W/m2.K)')
        ff_hot_si = df_per_shell.loc[find_property_label(df_per_shell.index, 'Fouling Factor'), 'Hot Fluid']; ff_cold_si = df_per_shell.loc[find_property_label(df_per_shell.index, 'Fouling Factor'), 'Cold Fluid']
        Do = geo_props.get('tube_outer_diameter', 0) / 1000; tube_thick = geo_props.get('tube_thickness', 0); Di = (Do - 2 * (tube_thick / 1000)) if Do > 0 else 0
        K_wall = geo_props.get('tube_material_conductivity'); Rw = (Do * np.log(Do / Di)) / (2 * K_wall) if K_wall > 0 and Do > 0 and Di > 0 and Do > Di else 0
        
        U_clean_kern, U_dirty_kern = np.nan, np.nan
        if pd.notna(h_cold) and h_cold > 0 and pd.notna(h_hot_kern) and h_hot_kern > 0:
            inv_U_clean_kern = (1 / h_hot_kern) + Rw + (Do / (Di * h_cold)); U_clean_kern = 1 / inv_U_clean_kern if inv_U_clean_kern > 0 else np.nan
            if pd.notna(U_clean_kern): inv_U_dirty_kern = (1/U_clean_kern) + ff_hot_si + (ff_cold_si * Do / Di if Di > 0 else 0); U_dirty_kern = 1 / inv_U_dirty_kern if inv_U_dirty_kern > 0 else np.nan
        final_results["kern_u_clean"] = U_clean_kern; final_results["kern_u_dirty"] = U_dirty_kern
        
        U_clean_bd, U_dirty_bd = np.nan, np.nan
        if pd.notna(h_cold) and h_cold > 0 and pd.notna(bd_htc_per_shell) and bd_htc_per_shell > 0:
            inv_U_clean_bd = (1 / bd_htc_per_shell) + Rw + (Do / (Di * h_cold)); U_clean_bd = 1 / inv_U_clean_bd if inv_U_clean_bd > 0 else np.nan
            if pd.notna(U_clean_bd): inv_U_dirty_bd = (1/U_clean_bd) + ff_hot_si + (ff_cold_si * Do / Di if Di > 0 else 0); U_dirty_bd = 1 / inv_U_dirty_bd if inv_U_dirty_bd > 0 else np.nan
        final_results["bd_u_clean"] = U_clean_bd; final_results["bd_u_dirty"] = U_dirty_bd

        # b) Calculate Total Pressure Drop
        final_results["kern_dp_shell"] = kern_results_per_shell.get('Shell-Side Pressure Drop (kPa)', 0) * N_series
        final_results["kern_dp_tube"] = kern_results_per_shell.get('Tube-Side Pressure Drop (kPa)', 0) * N_series
        final_results["bd_dp_shell"] = bd_dp_per_shell * N_series
        # final_results["bd_dp_shell"] = calculate_bell_delaware_dp.get()
        
        # c) Design Summary & Verification (uses total system values)
        t_hot_in = to_num(thermal_data.get('shell_inlet_temp')); t_hot_out = to_num(thermal_data.get('shell_outlet_temp'))
        t_cold_in = to_num(thermal_data.get('tube_inlet_temp')); t_cold_out = to_num(thermal_data.get('tube_outlet_temp'))
        del_t1 = t_hot_in - t_cold_out; del_t2 = t_hot_out - t_cold_in
        lmtd_uncorrected = (del_t1 - del_t2) / np.log(del_t1 / del_t2) if del_t1 > 0 and del_t2 > 0 and del_t1 != del_t2 else (del_t1 + del_t2) / 2
        
        F_factor = 1.0
        # Only apply F-factor for series arrangements with more than 1 shell pass
        if N_series > 1 and geo_props.get('number_of_passes', 1) > 1:
            P = (t_cold_out - t_cold_in) / (t_hot_in - t_cold_in) if (t_hot_in - t_cold_in) != 0 else 0
            R = (t_hot_in - t_hot_out) / (t_cold_out - t_cold_in) if (t_cold_out - t_cold_in) != 0 else 1
            if P * R != 1:
                try:
                    S = ((R**2 + 1)**0.5) / (R - 1)
                    num_log_arg = (1 - P * S) / (1 - P)
                    den_log_arg_num = (2/P) - 1 - R + S
                    den_log_arg_den = (2/P) - 1 - R - S
                    if num_log_arg > 0 and den_log_arg_num > 0 and den_log_arg_den > 0:
                        num = S * np.log(num_log_arg)
                        den = N_series * np.log(den_log_arg_num / den_log_arg_den)
                        F_factor = num / den if den != 0 else 1.0
                except (ValueError, ZeroDivisionError):
                    F_factor = 1.0 # Fallback on math error
        
        mtd_corrected = lmtd_uncorrected * F_factor
        Q_watts = to_num(thermal_data.get('heat_load')) * 1000
        A_single_shell = geo_props.get('number_of_tubes',0) * np.pi * (geo_props.get('tube_outer_diameter',0)/1000) * geo_props.get('tube_length',0)
        A_actual_total = A_single_shell * N_series * N_parallel
        
        design_summary = {"lmtd": mtd_corrected, "A_actual": A_actual_total}
        if pd.notna(Q_watts) and mtd_corrected > 0 and A_actual_total > 0:
            design_summary["U_service_rate"] = Q_watts / (A_actual_total * mtd_corrected)
        
        if pd.notna(U_dirty_kern) and U_dirty_kern > 0 and mtd_corrected > 0:
            A_req_kern = Q_watts / (U_dirty_kern * mtd_corrected)
            design_summary["A_req_kern"] = A_req_kern
            design_summary["margin_kern"] = ((A_actual_total - A_req_kern) / A_req_kern) * 100 if A_req_kern > 0 else np.nan
        
        if pd.notna(U_dirty_bd) and U_dirty_bd > 0 and mtd_corrected > 0:
            A_req_bd = Q_watts / (U_dirty_bd * mtd_corrected)
            design_summary["A_req_bd"] = A_req_bd
            design_summary["margin_bd"] = ((A_actual_total - A_req_bd) / A_req_bd) * 100 if A_req_bd > 0 else np.nan
            # design_summary["margin_bd"] = U_dirty_bd/(Q_watts / (A_actual_total * mtd_corrected)) if A_req_bd > 0 else np.nan
        
        final_results["design_summary"] = design_summary
        final_results["performance_summary"] = {
            'shell_reynolds': kern_results_per_shell.get('Shell-Side Reynolds No. (Kern)'),
            'shell_velocity': kern_results_per_shell.get('Shell-Side Velocity (m/s)'), # Assuming this key exists
            'tube_reynolds': kern_results_per_shell.get('Tube-Side Reynolds No.'),
            'tube_velocity': kern_results_per_shell.get('Tube-Side Velocity (m/s)')   # Assuming this key exists
        }

        
        final_results["Re_tube"] = kern_results_per_shell.get('Tube-Side Reynolds No.')
        final_results["Pr_tube"] = kern_results_per_shell.get('Tube-Side Prandtl No.')
        final_results["Pr_shell"] = kern_results_per_shell.get('Shell-Side Prandtl No.')
        final_results["Re_shell"] = kern_results_per_shell.get('Shell-Side Reynolds No. (Kern)')
        # d) Other per-shell checks
        final_results["flow_fractions"] = flow_fractions
        final_results["design_checks"] = {"momentum": calculate_momentum_checks(df_per_shell, nozzle_data, thermal_data_per_shell)}
        
        return jsonify(convert_nan_to_none(final_results))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An internal error occurred: {e}"}), 500

# # Helper function for momentum to keep the main route cleaner
# def calculate_momentum_checks(df, nozzle_data, thermal_data):
#     LIMIT_INLET_NO_IMPINGEMENT = 2230; LIMIT_WITH_IMPINGEMENT_OR_OUTLET = 5950
#     rho_hot = df.loc[find_property_label(df.index, 'Density'), 'Hot Fluid']; V_dot_hot = to_num(thermal_data.get('shell_flowrate'))
#     rho_cold = df.loc[find_property_label(df.index, 'Density'), 'Cold Fluid']; V_dot_cold = to_num(thermal_data.get('tube_flowrate'))
#     momentum_checks = {}
#     flow_unit = thermal_data.get('flowrate_unit', 'm3/s')
#     # flow_rate = get_si_flow_rate(flow_rate, flow_unit)

#     def calculate_momentum(density, flow_rate, nozzle_id_mm):
#         if pd.isna(density) or pd.isna(flow_rate) or pd.isna(nozzle_id_mm) or nozzle_id_mm <= 0: return np.nan
#         flow_rate = get_si_flow_rate(flow_rate, flow_unit)
#         #
#         area = (np.pi / 4) * (nozzle_id_mm / 1000)**2; velocity = flow_rate / area
#         return density * velocity**2
#     for side in ['shell', 'tube']:
#         for loc in ['inlet', 'outlet', 'intermediate']:
#             nozzle = nozzle_data.get(side, {}).get(loc)
#             if nozzle:
#                 nozzle_id = to_num(nozzle.get('id_mm'))
#                 V_dot_hot = get_si_flow_rate(V_dot_hot, flow_unit)
#                 if side == 'shell': value = calculate_momentum(rho_hot, V_dot_hot, nozzle_id); limit = LIMIT_INLET_NO_IMPINGEMENT if loc == 'inlet' else LIMIT_WITH_IMPINGEMENT_OR_OUTLET
#                 else: value = calculate_momentum(rho_cold, V_dot_cold, nozzle_id); limit = LIMIT_WITH_IMPINGEMENT_OR_OUTLET
#                 momentum_checks[f"{side}_{loc}"] = {"value": value, "limit": limit}
#     return momentum_checks

def calculate_momentum_checks(df, nozzle_data, thermal_data):
    LIMIT_INLET_NO_IMPINGEMENT = 2230
    LIMIT_WITH_IMPINGEMENT_OR_OUTLET = 5950
    rho_hot = df.loc[find_property_label(df.index, 'Density'), 'Hot Fluid']
    V_dot_hot = to_num(thermal_data.get('shell_flowrate'))
    rho_cold = df.loc[find_property_label(df.index, 'Density'), 'Cold Fluid']
    V_dot_cold = to_num(thermal_data.get('tube_flowrate'))
    momentum_checks = {}
    flow_unit = thermal_data.get('flowrate_unit', 'm3/s')

    def calculate_momentum(density, flow_rate, nozzle_id_mm):
        if pd.isna(density) or pd.isna(flow_rate) or pd.isna(nozzle_id_mm) or nozzle_id_mm <= 0:
            return np.nan
        si_flow_rate = get_si_flow_rate(flow_rate, flow_unit)
        area = (np.pi / 4) * (nozzle_id_mm / 1000)**2
        if area == 0: return np.nan
        velocity = si_flow_rate / area
        return density * velocity**2
    
    locations = ['inlet', 'outlet', 'intermediate']

    for side in ['shell', 'tube']:
        for loc in locations:
            nozzle = nozzle_data.get(side, {}).get(loc)
            if nozzle:
                nozzle_id = to_num(nozzle.get('id_mm'))
                
                if side == 'shell':
                    value = calculate_momentum(rho_hot, V_dot_hot, nozzle_id)
                else:  # 'tube' side
                    value = calculate_momentum(rho_cold, V_dot_cold, nozzle_id)
                
                # --- NEW SIMPLIFIED LIMIT LOGIC ---
                user_limit = to_num(nozzle.get('momentum_limit'))
                
                if pd.notna(user_limit) and user_limit > 0:
                    limit = user_limit
                else: # Fallback to TEMA standards if user input is missing/invalid
                    if loc == 'inlet' and side == 'shell':
                        limit = LIMIT_INLET_NO_IMPINGEMENT
                    else: # Covers all other cases (shell outlet/intermediate, all tube nozzles)
                        limit = LIMIT_WITH_IMPINGEMENT_OR_OUTLET
                
                momentum_checks[f"{side}_{loc}"] = {"value": value, "limit": limit}

    return momentum_checks




# --- Run Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5001)