


# In kern_calculator.py

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
    # Default: Assumes it's already m³/s
    return value

def calculate_all_performance(solved_df, geo_props, tube_viscosities, thermal_data, calc_U=True, calc_dP=True):
    """
    Calculates key performance metrics using Kern's Method.
    FINAL VERSION: Includes robust HTC and now the missing Pressure Drop calculations.
    """
    print("\n--- Running Kern's Method Performance Calculator ---")
    results = {}
    flow_paras = {}
    
    try:
        # --- Data Extraction ---
        rho_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Hot Fluid'])
        # rho_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Cold Fluid'])
        
        # --- FIX: Convert flow rates to SI units before use ---
        # flow_unit = thermal_data.get('flowrate_unit', 'm3/s')

        # --- THIS IS THE FIX ---
        # Get the unit string from the thermal_data dictionary passed from app.py
        flow_unit = thermal_data.get('flowrate_unit', 'm3/s')

        # Get the unconverted flow rate VALUE from the DataFrame
        V_dot_hot_from_df = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Hot Fluid'])
        V_dot_cold_from_df = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Cold Fluid'])
        
        # Use the local helper function to get a GUARANTEED SI value (m³/s)
        V_dot_hot = _get_flow_in_si(V_dot_hot_from_df, flow_unit)
        
        # All subsequent calculations now use the correct SI flow rates
        m_dot_hot = V_dot_hot * rho_hot
        
        # Extract other properties
        cp_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Sp.Heat Cap'), 'Hot Fluid']) * 1000
        mu_hot_pas = float(solved_df.loc[find_property_label(solved_df.index, 'Viscosity'), 'Hot Fluid']) * 0.001
        k_hot = float(solved_df.loc[find_property_label(solved_df.index, 'Thermal Conductivity'), 'Hot Fluid'])

        rho_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Density'), 'Cold Fluid'])
        # V_dot_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Flow Rate'), 'Cold Fluid'])
        # m_dot_cold = V_dot_cold * rho_cold
        V_dot_cold = _get_flow_in_si(V_dot_cold_from_df, flow_unit)
        m_dot_cold = V_dot_cold * rho_cold

        cp_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Sp.Heat Cap'), 'Cold Fluid']) * 1000
        mu_cold_pas = float(solved_df.loc[find_property_label(solved_df.index, 'Viscosity'), 'Cold Fluid']) * 0.001
        k_cold = float(solved_df.loc[find_property_label(solved_df.index, 'Thermal Conductivity'), 'Cold Fluid'])

        # --- Geometry (meters) ---
        Ds = geo_props['shell_diameter'] / 1000
        Do = geo_props['tube_outer_diameter'] / 1000
        Di = (geo_props['tube_outer_diameter'] - 2 * geo_props['tube_thickness']) / 1000
        Pt = geo_props['tube_pitch'] / 1000
        B = geo_props['baffle_spacing'] / 1000
        Nt = geo_props['number_of_tubes']
        Np = geo_props['number_of_passes']
        L_tube = geo_props['tube_length']



        # --- Tube Side HTC Calculations ---
        At_per_pass = (Nt / Np) * (np.pi / 4) * (Di**2)
        Gt = m_dot_cold / At_per_pass if At_per_pass > 0 else 0
        Re_tube = (Gt * Di) / mu_cold_pas if mu_cold_pas > 0 else 0
        Pr_tube = (cp_cold * mu_cold_pas) / k_cold if k_cold > 0 else 0
        results['Tube-Side Reynolds No.'] = Re_tube
        results['Tube-Side Prandtl No.'] = Pr_tube
        
        mu_bulk_cp = tube_viscosities.get('bulk'); mu_wall_cp = tube_viscosities.get('wall')
        viscosity_ratio = (mu_bulk_cp / mu_wall_cp) if (mu_bulk_cp and mu_wall_cp and mu_wall_cp > 0) else 1
        
        Nu_tube = 0
        if Re_tube > 4000:
            Nu_tube = 0.023 * (Re_tube**0.8) * (Pr_tube**(1/3)) * (viscosity_ratio**0.14)
        elif Re_tube > 0:
            Gz = Re_tube * Pr_tube * (Di / L_tube) if L_tube > 0 else 0
            if Gz > 0: Nu_tube = 1.86 * (Gz**(1/3)) * (viscosity_ratio**0.14)
            else: Nu_tube = 3.66
        
        h_cold = (Nu_tube * k_cold) / Di if Di > 0 else 0
        results['Tube-Side h (W/m2.K)'] = h_cold
        flow_paras['Re_tube'] = Re_tube
        flow_paras['Pr_tube'] = Pr_tube

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
        results['Shell-Side Reynolds No. (Kern)'] = Re_shell_kern
        results['Shell-Side Prandtl No.'] = Pr_shell
        results['Shell-Side h (Kern Method) (W/m2.K)'] = h_hot
        results['m_dot_hotti'] = V_dot_hot * rho_hot
        flow_paras['Re_shell'] = Re_shell_kern
        flow_paras['Pr_shell'] = Pr_shell

                        # Outer Tube Limit (OTL) diameter
        if geo_props.get('tube_layout', 'triangular').lower() == 'triangular': K1, n1 = 0.319, 2.142
        else: K1, n1 = 0.215, 2.207
        results['D_otl'] = Do * (Nt / K1)**(1 / n1) if K1 > 0 and Nt > 0 else 0


        ### --- PRESSURE DROP CALCULATION --- ###
        if calc_dP:
            # Tube-side pressure drop (friction + return + nozzle)
            if Re_tube > 4000: f_tube = 0.3164 / (Re_tube**0.25)
            elif Re_tube > 0: f_tube = 64 / Re_tube
            else: f_tube = 0
            
            v_tube = Gt / rho_cold if rho_cold > 0 else 0
            dP_friction_tube = f_tube * (L_tube * Np / Di) * (rho_cold * v_tube**2 / 2) if Di > 0 else 0
            dP_return_tube = 4 * Np * (rho_cold * v_tube**2 / 2)
            
            D_nozzle_tube_m = geo_props.get('tube_nozzle_diameter')
            dP_nozzle_tube = 0
            if pd.notna(D_nozzle_tube_m) and D_nozzle_tube_m > 0:
                A_nozzle_tube = (np.pi / 4) * (D_nozzle_tube_m / 1000)**2
                v_nozzle_tube = V_dot_cold / A_nozzle_tube if A_nozzle_tube > 0 else 0
                dP_nozzle_tube = 1.5 * (rho_cold * v_nozzle_tube**2 / 2)
            
            results['Tube-Side Pressure Drop (kPa)'] = (dP_friction_tube + dP_return_tube + dP_nozzle_tube) / 1000

            # Shell-side pressure drop (bundle + nozzles)
            f_shell = np.exp(0.576 - 0.19 * np.log(Re_shell_kern)) if Re_shell_kern > 0 else 0
            N_b = int(L_tube / B) if B > 0 else 0
            dP_bundle_shell = f_shell * (Gs_kern**2 * Ds * (N_b + 1)) / (2 * De_kern * rho_hot * (viscosity_ratio**0.14)) if De_kern > 0 and rho_hot > 0 else 0

            D_nozzle_shell_m = geo_props.get('shell_nozzle_diameter')
            dP_nozzle_shell = 0
            if pd.notna(D_nozzle_shell_m) and D_nozzle_shell_m > 0:
                A_nozzle_shell = (np.pi / 4) * (D_nozzle_shell_m / 1000)**2
                v_nozzle_shell = V_dot_hot / A_nozzle_shell if A_nozzle_shell > 0 else 0
                dP_nozzle_shell = 1.5 * (rho_hot * v_nozzle_shell**2 / 2)
            
            results['Shell-Side Pressure Drop (kPa)'] = (dP_bundle_shell + dP_nozzle_shell)/1000

    except Exception as e:
        print(f"ERROR during performance calculation: {e}")
        traceback.print_exc()
        keys = ['Tube-Side Reynolds No.', 'Tube-Side Prandtl No.', 'Tube-Side h (W/m2.K)', 
                'Shell-Side Reynolds No. (Kern)', 'Shell-Side Prandtl No.', 'Shell-Side h (Kern Method) (W/m2.K)',
                'Tube-Side Pressure Drop (kPa)', 'Shell-Side Pressure Drop (kPa)']
        results = {key: np.nan for key in keys}
    
    print(results)
    return results