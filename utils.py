# utils.py

import pandas as pd

def get_si_flow_rate(flow_rate_value, unit_string):
    """
    Takes a flow rate value and its unit string (e.g., 'lpm', 'm3/h')
    and robustly converts it to SI units (m³/s).
    """
    val = pd.to_numeric(flow_rate_value, errors='coerce')
    if pd.isna(val) or val is None:
        return 0.0

    if unit_string == 'lpm':
        return val / 60000.0  # Liters per minute to m³/s
    elif unit_string == 'm3/h':
        return val / 3600.0   # m³/hour to m³/s
    
    # Default case: if unit is 'm3/s' or unknown, assume it's already in SI units
    return val