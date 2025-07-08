

# bell_delaware_calculator.py

import numpy as np
import pandas as pd
from file_handler import find_property_label
import traceback

def _get_flow_in_si(value, unit_string):
    """A local helper to ensure flow rate is always in m³/s."""
    if unit_string == 'lpm':
        return value / 60000.0
    if unit_string == 'm3/h':
        return value / 3600.0
    return value


def get_common_bd_params(solved_df, geo_props, thermal_data):
    """
    Reads common parameters and performs initial calculations for Bell-Delaware methods.
    """
    try:
        params = {}
        # Fluid properties
        params['rho_hot'] = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Hot Fluid'])
        
        # --- THIS IS THE FIX ---
        flow_unit = thermal_data.get('flowrate_unit', 'm3/s')
        V_dot_hot_from_df = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Hot Fluid'])
        V_dot_hot_si = _get_flow_in_si(V_dot_hot_from_df, flow_unit)
        
        # Use the corrected SI values for all subsequent calculations
        params['V_dot_hot'] = V_dot_hot_si
        params['m_dot_hot'] = V_dot_hot_si * params['rho_hot']

        #         # --- FIX: Convert flow rate to SI units before use ---
        # flow_unit = thermal_data.get('flowrate_unit', 'm3/s')
        # V_dot_hot_from_df = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Hot Fluid'])
        # V_dot_hot_si = _get_flow_in_si(V_dot_hot_from_df, flow_unit)
        
        # params['V_dot_hot'] = V_dot_hot_si
        # params['m_dot_hot'] = V_dot_hot_si * params['rho_hot']
        
        params['cp_hot'] = float(solved_df.loc[find_property_label(solved_df.index, 'Sp.Heat Cap'), 'Hot Fluid']) * 1000
        params['mu_hot_pas'] = float(solved_df.loc[find_property_label(solved_df.index, 'Viscosity'), 'Hot Fluid']) * 0.001
        params['k_hot'] = float(solved_df.loc[find_property_label(solved_df.index, 'Thermal Conductivity'), 'Hot Fluid'])
        
        # Geometry in meters
        params['Ds'] = geo_props['shell_diameter'] / 1000
        params['Do'] = geo_props['tube_outer_diameter'] / 1000
        Pt = geo_props['tube_pitch'] / 1000
        params['B'] = geo_props['baffle_spacing'] / 1000
        params['Nt'] = geo_props.get('number_of_tubes', 0)
        
        # Baffle and layout parameters
        baffle_cut_fraction = geo_props.get('baffle_cut', 25) / 100
        params['Nss'] = geo_props.get('num_sealing_strips', 0)
        params['number_of_passes'] = geo_props.get('num_passes', 1)
        
        # Cross-flow area at bundle centerline
        params['As'] = (params['Ds'] * (Pt - params['Do']) * params['B']) / Pt if Pt > 0 else 0
        
        # Baffle window angle and fraction of tubes in window
        arg_theta = 1 - 2 * baffle_cut_fraction
        params['theta_ds'] = 2 * np.arccos(arg_theta) if -1 <= arg_theta <= 1 else np.pi
        F_w = (params['theta_ds'] - np.sin(params['theta_ds'])) / (2 * np.pi)
        params['F_w'] = F_w
        
        # Tube counts in crossflow and window
        params['N_t_c'] = params['Nt'] * (1 - F_w)
        params['N_t_w'] = params['Nt'] * F_w
        
        # Number of tube rows crossed
        params['Nrc'] = (params['Ds'] * (1 - 2 * baffle_cut_fraction)) / Pt if Pt > 0 else 0
        
        # Outer Tube Limit (OTL) diameter
        if geo_props.get('tube_layout', 'triangular').lower() == 'triangular': K1, n1 = 0.319, 2.142
        else: K1, n1 = 0.215, 2.207
        params['D_otl'] = params['Do'] * (params['Nt'] / K1)**(1 / n1) if K1 > 0 and params['Nt'] > 0 else 0
        
        # Bundle-to-shell bypass area
        params['A_bp'] = params['B'] * (params['Ds'] - params['D_otl']) if params['Ds'] > params['D_otl'] else 0

        return params
    except Exception as e:
        print(f"ERROR in get_common_bd_params: {e}"); traceback.print_exc(); return {}
    
    
import numpy as np

def calculate_flow_fractions(p, geo_props):
    """
    Calculates the shell-side flow distribution using the iterative pressure-balance method.
    Returns mass flow fractions for: A (tube-to-baffle leakage), B (crossflow),
    C (bundle-to-shell bypass), E (baffle-to-shell leakage), F (partition bypass).
    """
    try:
        # === 1. Extract Fluid and Geometric Properties ===
        m_dot_total = p['m_dot_hot']
        rho = p['rho_hot']
        mu = p['mu_hot_pas']
        if m_dot_total <= 0 or rho <= 0 or mu <= 0:
            return {}
                # The Pt here is just for the 'b' stream area, which is a different 'Pt'

        Do = p['Do']                      # Tube outer diameter
        Ds = p['Ds']                      # Shell diameter
        B_spacing = p['B']                # Baffle spacing
        N_t_c = p['N_t_c']                # Tubes in crossflow
        Pt = geo_props.get('tube_pitch', 12.6) / 1000
        clearance_tb = geo_props.get('tube_baffle_clearance', 0.8) / 1000
        clearance_sb = geo_props.get('shell_baffle_clearance', 3.5) / 1000
        theta_baffle_arc = 2 * np.arccos(1 - 2 * (geo_props.get('baffle_cut', 25) / 100))

        # === 2. Calculate Areas for Each Flow Path ===



        # === 2. Calculate Areas for Each Flow Path ===pass_lane_width
        

        A_f = 0
        num_passes = p.get('num_passes', 1)
        if num_passes >= 1:
            pass_layout = geo_props.get('pass_layout', 'standard')
            lane_width_mm = pd.to_numeric(geo_props.get('pass_lane_width'), errors='coerce')
            
            # Initialize lane_width to 0. It will only become non-zero if the user provides a valid input.
            lane_width = 0
            
            # Use user-provided lane width ONLY if available and valid. Otherwise, it remains zero.
            if pd.notna(lane_width_mm) and lane_width_mm > 0:
                lane_width = lane_width_mm / 1000 # convert to meters

            # This calculation now depends entirely on the user-provided width.
            # If no width was provided, lane_width is 0, so A_f will be 0.
            if pass_layout == 'none':
                A_f = 0 # Explicitly no bypass lane
            elif pass_layout == 'quadrant':
                A_f = B_spacing * lane_width * 2  # 2 lanes
            elif pass_layout == 'ribbon':
                # Assumes user input is the *total* width of all lanes
                A_f = B_spacing * lane_width
            elif pass_layout == 'standard':
                A_f = B_spacing * lane_width  # 1 lane


        # Define the dictionary of areas *after* A_f has been determined.
        A = {
            'b': B_spacing * Ds * (Pt - Do) / Pt if Pt > 0 else 0,
            'a': np.pi * Do * (clearance_tb / 2) * N_t_c,
            'e': 0.5 * Ds * (clearance_sb / 2) * (2 * np.pi - theta_baffle_arc),
            'c': B_spacing * (Ds - p.get('D_otl', Do)),
            'f': A_f  # This now uses the correctly calculated A_f
        }

        total_area = sum(A.values())
        if total_area <= 0:
            return {}

        # === 3. Initialize Fractions and Loop Setup ===
        fractions = {k: A[k] / total_area for k in A}
        max_iter = 15
        tol = 0.001

        for _ in range(max_iter):
            m_dot = {k: m_dot_total * f for k, f in fractions.items()}
            delta_p = {}

            # --- Crossflow (b)
            G_b = m_dot['b'] / A['b'] if A['b'] > 0 else 1e-6
            Re_b = G_b * Do / mu
            f_b = 0.25 * (1.1 * Re_b)**-0.2 if Re_b > 0 else 1
            delta_p['b'] = 2 * f_b * (G_b**2) * p.get('Nrc', 10) / rho

            # --- Other streams (a, e, c, f) via K-factor orifice model
            for s, K in [('a', 2.5), ('e', 2), ('c', 1.5), ('f', 1.0)]:
                if A[s] > 0:
                    if s == 'c':
                        strips = geo_props.get('num_sealing_strips', 0)
                        if strips > 0:
                            K *= (5.0 * strips)
                    delta_p[s] = K * (m_dot[s]**2) / (2 * rho * A[s]**2)
                else:
                    delta_p[s] = 1e6  # High resistance if area is zero

            # --- Convergence check
            max_dp = max(delta_p.values())
            min_dp = min(delta_p.values())
            if (max_dp - min_dp) / max_dp < tol:
                break

            # --- Apply correction
            avg_dp = np.mean(list(delta_p.values()))
            correction = {s: (avg_dp / dp)**0.5 if dp > 0 else 1 for s, dp in delta_p.items()}
            new_fractions_raw = {s: fractions[s] * correction[s] for s in fractions}
            total_raw = sum(new_fractions_raw.values())
            fractions = {s: v / total_raw for s, v in new_fractions_raw.items()}

        # === 4. Return using your naming convention ===
        return {
            'A_fraction': fractions['a'],  # Tube-baffle leakage
            'B_fraction': fractions['b'],  # Main crossflow
            'C_fraction': fractions['c'],  # Bundle-shell bypass
            'E_fraction': fractions['e'],  # Baffle-shell leakage
            'F_fraction': fractions['f']   # Partition bypass
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'error': str(e)}

    




def calculate_bell_delaware_htc(solved_df, geo_props,thermal_data):
    print("\n--- Running Bell-Delaware HTC Calculation ---")
    try:
        # p = get_common_bd_params(solved_df, geo_props)
        # if not p: return np.nan

        p = get_common_bd_params(solved_df, geo_props, thermal_data)
        if not p: return np.nan

        m_dot_effective = p['m_dot_hot']
        if geo_props.get('baffle_type') == 'Double Segmental':
            m_dot_effective = p['m_dot_hot'] / 2
            print("-> Double-segmental baffle selected. Effective mass flow rate halved for HTC calc.")
        rho_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Hot Fluid'])
        V_dot_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Hot Fluid'])
        m_dot_hot = V_dot_hot * rho_hot
        cp_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Sp.Heat Cap'), 'Hot Fluid']) * 1000
        mu_hot_pas = float(solved_df.loc[find_property_label(solved_df.index, 'Viscosity'), 'Hot Fluid']) * 0.001
        k_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Thermal Conductivity'), 'Hot Fluid'])

        rho_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Cold Fluid'])
        V_dot_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Cold Fluid'])
        m_dot_cold = V_dot_cold * rho_cold
        cp_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Sp.Heat Cap'), 'Cold Fluid']) * 1000
        mu_cold_pas = float(solved_df.loc[find_property_label(solved_df.index, 'Viscosity'), 'Cold Fluid']) * 0.001
        k_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Thermal Conductivity'), 'Cold Fluid'])
        Ds = geo_props['shell_diameter'] / 1000
        Do = geo_props['tube_outer_diameter'] / 1000
        Di = (geo_props['tube_outer_diameter'] - 2 * geo_props['tube_thickness']) / 1000
        Pt = geo_props['tube_pitch'] / 1000
        B = geo_props['baffle_spacing'] / 1000
        Nt = geo_props['number_of_tubes']
        Np = geo_props['number_of_passes']
        L_tube = geo_props['tube_length']
        
        


                # --- Shell Side HTC (Kern's Method) ---
        As_kern = (Ds * (Pt - Do) * B) / Pt if Pt > 0 else 0
        if 'square' in geo_props.get('tube_layout', 'triangular').lower(): De_kern = (4 * (Pt**2 - (np.pi * Do**2 / 4))) / (np.pi * Do)
        else: De_kern = (4 * ((np.sqrt(3)/4 * Pt**2) - (np.pi * Do**2 / 8))) / (np.pi * Do / 2)
        Gs_kern = m_dot_hot / As_kern if As_kern > 0 else 0
        Re_shell_kern = (Gs_kern * De_kern) / mu_hot_pas if mu_hot_pas > 0 else 0
        Pr_shell = (cp_hot * mu_hot_pas) / k_hot if k_hot > 0 else 0
        
        if Re_shell_kern >= 1000: C, m = 0.27, 0.63
        elif 100 <= Re_shell_kern < 1000: C, m = 0.35, 0.60
        else: C, m = 1.04, 0.40
        
        Nu_shell_kern = C * (Re_shell_kern**m) * (Pr_shell**(1/3)) if C > 0 else 0
        h_hot = (Nu_shell_kern * k_hot) / De_kern if De_kern > 0 else 0

        # Gs = p['m_dot_hot'] / p['As'] if p['As'] > 0 else 0
        # Re_crossflow = (Gs * p['Do']) / p['mu_hot_pas'] if p['mu_hot_pas'] > 0 else 0
        # Pr_shell = (p['cp_hot'] * p['mu_hot_pas']) / p['k_hot'] if p['k_hot'] > 0 else 0

                # Calculations now use m_dot_effective
        Gs = m_dot_effective / p['As'] if p['As'] > 0 else 0
        Re_crossflow = (Gs * p['Do']) / p['mu_hot_pas'] if p['mu_hot_pas'] > 0 else 0
        Pr_shell = (p['cp_hot'] * p['mu_hot_pas']) / p['k_hot'] if p['k_hot'] > 0 else 0

        
        if Re_crossflow > 1000: j_H = 0.25 * (Re_crossflow**-0.4)
        elif 10 <= Re_crossflow <= 1000: j_H = 0.3 * (Re_crossflow**-0.3)
        else: j_H = 1.4 * (Re_crossflow**-0.7)
        h_ideal = (j_H * Re_crossflow * (Pr_shell**(1/3)) * p['k_hot']) / p['Do'] if p['Do'] > 0 else 0

        # Correction Factors
        Jc = 0.55 + 0.72 * (1 - 2 * p['F_w'])
                # For double-segmental, the window effect is less pronounced
        if geo_props.get('baffle_type') == 'Double Segmental':
            Jc = (1 + Jc) / 2 # A simple averaging to increase Jc

        # ... (Jl and Jb calculations remain the same) ...
        D_tb_clearance = geo_props.get('tube_baffle_clearance', 0.8) / 1000
        D_sb_clearance = geo_props.get('shell_baffle_clearance', 3.5) / 1000
        A_tb = (np.pi * p['Do'] * D_tb_clearance * p['N_t_c'])
        A_sb = 0.5 * p['Ds'] * D_sb_clearance * (2 * np.pi - (2 * np.arccos(1 - 2 * (geo_props.get('baffle_cut', 25)/100))))
        
        r_L = (A_tb + A_sb) / p['As'] if p['As'] > 0 else 0
        r_s = A_sb / (A_tb + A_sb) if (A_tb + A_sb) > 0 else 0
        Jl = 0.44 * (1 - r_s) + (1 - 0.44 * (1 - r_s)) * np.exp(-2.2 * r_L)
        
        r_b = p['A_bp'] / p['As'] if p['As'] > 0 else 0
        C_jb = 1.35
        if p.get('Nss', 0) > 0 and p.get('Nrc', 0) > 0 and (2 * p['Nss'] / p['Nrc']) < 1:
            Jb = np.exp(-C_jb * r_b * (1 - (2 * p['Nss'] / p['Nrc'])**(1/3)))
        else: Jb = np.exp(-C_jb * r_b)
        
        print(f"B-D Factors: Jc={Jc:.3f}, Jl={Jl:.3f}, Jb={Jb:.3f}")
        # Jc = 0.75
        # Jl = 0.9
        # Jb = 0.75
        htc = min(h_ideal,h_hot)
        return htc * Jc * Jb * Jl
        # return h_hot * Jc * Jb * Jl
    except Exception as e:
        print(f"ERROR during Bell-Delaware HTC calculation: {e}"); traceback.print_exc(); return np.nan

def calculate_bell_delaware_dp(solved_df, geo_props, nozzle_data,thermal_data):
    """Calculates the shell-side Pressure Drop (dP) using Bell-Delaware."""
    print("\n--- Running Bell-Delaware dP Calculation ---")
    try:
        p = get_common_bd_params(solved_df, geo_props, thermal_data)
        if not p: return np.nan

                # --- NEW: Adjust mass flow rate for baffle type ---
        m_dot_effective = p['m_dot_hot']
        if geo_props.get('baffle_type') == 'Double Segmental':
            m_dot_effective = p['m_dot_hot'] / 2
            print("-> Double-segmental baffle selected. Effective mass flow rate halved for dP calc.")
        
        # Calculations now use m_dot_effective
        Gs = m_dot_effective / p['As'] if p['As'] > 0 else 0
        Re_crossflow = (Gs * p['Do']) / p['mu_hot_pas'] if p['mu_hot_pas'] > 0 else 0

        # Ideal pressure drop components
        f_c = 0.35 * (1.1 * Re_crossflow)**-0.2 if Re_crossflow > 0 else 0
                # Number of rows crossed is also halved for double-segmental
        Nrc_effective = p['Nrc']
        if geo_props.get('baffle_type') == 'Double Segmental':
            Nrc_effective = p['Nrc'] / 2
        dP_c_ideal = 2 * f_c * Gs**2 * Nrc_effective / p['rho_hot'] if p['rho_hot'] > 0 else 0
        
        Aw = (p['Ds']**2 / 4) * (p['theta_ds']/2 - (1 - 2*p['F_w'])*np.sin(p['theta_ds']/2))
        A_t_w_area = p['N_t_w'] * (np.pi * p['Do']**2 / 4)
        Aw_net = Aw - A_t_w_area if Aw > A_t_w_area else 0
        Gw = p['m_dot_hot'] / np.sqrt(p['As'] * Aw_net) if (p['As'] * Aw_net) > 0 else 0
        dP_w_ideal = Gw**2 / (2 * p['rho_hot']) if p['rho_hot'] > 0 else 0
        
        # dP Correction factors
        D_tb_clearance = geo_props.get('tube_baffle_clearance', 0.8) / 1000
        D_sb_clearance = geo_props.get('shell_baffle_clearance', 3.5) / 1000
        A_tb = (np.pi * p['Do'] * D_tb_clearance * p['N_t_c']); A_sb = (p['Ds'] * D_sb_clearance * (np.pi - p['theta_ds']/2))
        r_L = (A_tb + A_sb) / p['As'] if p['As'] > 0 else 0
        r_b = p['A_bp'] / p['As'] if p['As'] > 0 else 0
        R_l = np.exp(-1.33 * r_L)
        
        if p.get('Nss', 0) == 0: R_b = np.exp(-4.5 * r_b)
        else:
             if p.get('Nrc', 0) > 0 and (2*p['Nss']/p['Nrc']) < 1: R_b = np.exp(-4.5 * r_b * (1 - (2 * p['Nss'] / p['Nrc'])**(1/3)))
             else: R_b = np.exp(-4.5 * r_b)

        L_tube = geo_props['tube_length']; N_b = int(L_tube / p['B']) if p.get('B', 0) > 0 else 0
        if geo_props.get('baffle_type') == 'Double Segmental':
            N_b = N_b * 2
        dP_central_bays = (N_b - 1) * dP_c_ideal * R_b
        dP_all_windows = N_b * dP_w_ideal * R_l
        dP_end_zones = 1.2 * dP_c_ideal * R_b * (1 + p.get('N_t_c',0)/p.get('Nrc',1)) / (2 * (1-p['F_w'])) if (1-p['F_w'])>0 else 0


        dP_bundle_Pa = dP_central_bays + dP_all_windows + dP_end_zones

                # --- PART B: NOZZLE PRESSURE DROP ---
        dP_nozzles_Pa = 0
        nozzle_inlet_id = pd.to_numeric(nozzle_data.get('shell', {}).get('inlet', {}).get('id_mm'), errors='coerce')
        nozzle_outlet_id = pd.to_numeric(nozzle_data.get('shell', {}).get('outlet', {}).get('id_mm'), errors='coerce')

        # Calculate for Inlet Nozzle
        if pd.notna(nozzle_inlet_id) and nozzle_inlet_id > 0:
            A_nozzle_in = (np.pi / 4) * (nozzle_inlet_id / 1000)**2
            v_nozzle_in = p['V_dot_hot'] / A_nozzle_in if A_nozzle_in > 0 else 0
            # Using standard K=1.5 for entrance/exit losses
            dP_nozzles_Pa += 1.5 * (p['rho_hot'] * v_nozzle_in**2 / 2)

        # Calculate for Outlet Nozzle
        if pd.notna(nozzle_outlet_id) and nozzle_outlet_id > 0:
            A_nozzle_out = (np.pi / 4) * (nozzle_outlet_id / 1000)**2
            v_nozzle_out = p['V_dot_hot'] / A_nozzle_out if A_nozzle_out > 0 else 0
            dP_nozzles_Pa += 1.5 * (p['rho_hot'] * v_nozzle_out**2 / 2)

        # --- FINAL CALCULATION ---
        total_dP_Pa = (dP_bundle_Pa + dP_nozzles_Pa)*1/1000
        print(total_dP_Pa)
        results1 = (dP_central_bays + dP_all_windows + dP_end_zones) / 1000
        
        # return (dP_central_bays + dP_all_windows + dP_end_zones) / 1000
        return total_dP_Pa
    except Exception as e:
        print(f"ERROR during Bell-Delaware dP calculation: {e}"); traceback.print_exc(); return np.nan


