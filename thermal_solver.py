
# thermal_solver.py

import pandas as pd
import numpy as np
from file_handler import find_property_label

def solve_thermal_balance(df):
    """
    Reads heat exchanger properties from a DataFrame and solves for up to two
    missing variables from the heat balance equations. This is based on the user's original logic.
    """
    df_solved = df.copy()

    try:
        labels = {
            'flow': find_property_label(df.index, 'Flow Rate'),
            'T_in': find_property_label(df.index, 'Inlet Temp'),
            'T_out': find_property_label(df.index, 'Outlet Temp'),
            'Q': find_property_label(df.index, 'Heat Load'),
            'cp': find_property_label(df.index, 'Sp.Heat Cap'),
            'rho': find_property_label(df.index, 'Density')
        }
    except KeyError as e:
        print(f"FATAL ERROR: A required thermal property is missing. {e}")
        return None

    q_hot_val = pd.to_numeric(df_solved.loc[labels['Q'], 'Hot Fluid'], errors='coerce')
    q_cold_val = pd.to_numeric(df_solved.loc[labels['Q'], 'Cold Fluid'], errors='coerce')
    final_Q = q_hot_val if pd.notna(q_hot_val) else q_cold_val

    props = {
        'flow_hot': pd.to_numeric(df_solved.loc[labels['flow'], 'Hot Fluid'], errors='coerce'), 'rho_hot': pd.to_numeric(df_solved.loc[labels['rho'], 'Hot Fluid'], errors='coerce'),
        'cp_hot': pd.to_numeric(df_solved.loc[labels['cp'], 'Hot Fluid'], errors='coerce'), 'T_hot_in': pd.to_numeric(df_solved.loc[labels['T_in'], 'Hot Fluid'], errors='coerce'),
        'T_hot_out': pd.to_numeric(df_solved.loc[labels['T_out'], 'Hot Fluid'], errors='coerce'),
        'flow_cold': pd.to_numeric(df_solved.loc[labels['flow'], 'Cold Fluid'], errors='coerce'), 'rho_cold': pd.to_numeric(df_solved.loc[labels['rho'], 'Cold Fluid'], errors='coerce'),
        'cp_cold': pd.to_numeric(df_solved.loc[labels['cp'], 'Cold Fluid'], errors='coerce'), 'T_cold_in': pd.to_numeric(df_solved.loc[labels['T_in'], 'Cold Fluid'], errors='coerce'),
        'T_cold_out': pd.to_numeric(df_solved.loc[labels['T_out'], 'Cold Fluid'], errors='coerce'),
        'Q': final_Q
    }

    unknowns = {key for key, val in props.items() if pd.isna(val)}
    print(f"\nFound {len(unknowns)} unknown thermal variables: {sorted(list(unknowns))}\n")

    if len(unknowns) > 2:
        print("Error: More than 2 unknown variables found. Problem is unsolvable.")
        return None

    solved_this_iteration = True
    while unknowns and solved_this_iteration:
        solved_this_iteration = False
        
        # Hot Side: Q [kW] = (V_dot [m³/s] * rho [kg/m³]) * cp [kJ/kg.K] * ΔT [K]
        hot_side_vars = {'Q', 'flow_hot', 'cp_hot', 'T_hot_in', 'T_hot_out', 'rho_hot'}
        if len(unknowns.intersection(hot_side_vars)) == 1:
            unknown = unknowns.intersection(hot_side_vars).pop()
            try:
                m_dot_hot = props['flow_hot'] * props['rho_hot'] # Mass Flow Rate in kg/s
                if unknown == 'Q':
                    props['Q'] = m_dot_hot * props['cp_hot'] * (props['T_hot_in'] - props['T_hot_out'])
                elif unknown == 'T_hot_out':
                    props['T_hot_out'] = props['T_hot_in'] - props['Q'] / (m_dot_hot * props['cp_hot'])
                elif unknown == 'T_hot_in':
                    props['T_hot_in'] = props['T_hot_out'] + props['Q'] / (m_dot_hot * props['cp_hot'])
                elif unknown == 'flow_hot':
                    m_dot_req = props['Q'] / (props['cp_hot'] * (props['T_hot_in'] - props['T_hot_out']))
                    props['flow_hot'] = m_dot_req / props['rho_hot']
                
                print(f"-> Solved '{unknown}' using hot side: {props[unknown]:.4f}")
                unknowns.remove(unknown)
                solved_this_iteration = True
            except (ZeroDivisionError, TypeError, ValueError): pass

        # Cold Side: Q [kW] = (V_dot [m³/s] * rho [kg/m³]) * cp [kJ/kg.K] * ΔT [K]
        cold_side_vars = {'Q', 'flow_cold', 'cp_cold', 'T_cold_in', 'T_cold_out', 'rho_cold'}
        if len(unknowns.intersection(cold_side_vars)) == 1:
            unknown = unknowns.intersection(cold_side_vars).pop()
            try:
                m_dot_cold = props['flow_cold'] * props['rho_cold'] # Mass Flow Rate in kg/s
                if unknown == 'Q':
                    props['Q'] = m_dot_cold * props['cp_cold'] * (props['T_cold_out'] - props['T_cold_in'])
                elif unknown == 'T_cold_out':
                    props['T_cold_out'] = props['T_cold_in'] + props['Q'] / (m_dot_cold * props['cp_cold'])
                elif unknown == 'T_cold_in':
                    props['T_cold_in'] = props['T_cold_out'] - props['Q'] / (m_dot_cold * props['cp_cold'])
                elif unknown == 'flow_cold':
                    m_dot_req = props['Q'] / (props['cp_cold'] * (props['T_cold_out'] - props['T_cold_in']))
                    props['flow_cold'] = m_dot_req / props['rho_cold']

                print(f"-> Solved '{unknown}' using cold side: {props[unknown]:.4f}")
                unknowns.remove(unknown)
                solved_this_iteration = True
            except (ZeroDivisionError, TypeError, ValueError): pass
    
    if unknowns:
        print(f"\nError: Could not solve for all variables. Remaining unknowns: {unknowns}")
        return None
    
    print("\n--- All thermal unknowns solved successfully! ---")

    df_solved.loc[labels['Q'], :] = props['Q'] 
    for side, side_cap in [('hot', 'Hot'), ('cold', 'Cold')]:
        df_solved.loc[labels['flow'], f'{side_cap} Fluid'] = props[f'flow_{side}']
        df_solved.loc[labels['T_in'], f'{side_cap} Fluid'] = props[f'T_{side}_in']
        df_solved.loc[labels['T_out'], f'{side_cap} Fluid'] = props[f'T_{side}_out']
        
    return df_solved