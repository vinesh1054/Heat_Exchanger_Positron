# # file_handler.py


# file_handler.py

import pandas as pd
import numpy as np

def find_property_label(index, keyword):
    """Finds the full property label in the DataFrame index using a keyword."""
    # Special handling for common typos or variations
    if keyword.lower() == 'outlet temp':
        for label in index:
            if 'outlet temp' in label.lower() or 'oulet temp' in label.lower():
                return label
    
    for label in index:
        if keyword.lower() in label.lower():
            return label
            
    # Raise a specific error if a keyword is absolutely essential and not found.
    # For a safer approach used in safe_read_property, we can let it return None.
    return None 

def safe_read_property(df, keyword, is_numeric=True):
    """
    Safely reads a single property from the DataFrame.
    Returns np.nan if the property is not found or is not a valid number.
    """
    try:
        label = find_property_label(df.index, keyword)
        if label is None: # If find_property_label couldn't find it
            # This warning is now more specific
            # print(f"Warning: Property for '{keyword}' not found in Excel.")
            return np.nan

        # Take the first data column value (typically 'Hot Fluid' or 'Value')
        value = df.loc[label].iloc[0]
        if is_numeric:
            return pd.to_numeric(value, errors='coerce')
        return value
    except (KeyError, IndexError):
        # This will catch errors if the label is found but the column structure is wrong
        return np.nan

def read_data(filepath):
    """Reads the Excel file and returns a DataFrame."""
    try:
        df = pd.read_excel(filepath, index_col=0, header=0)
        print("--- Original Data Loaded ---")
        print(df.to_string())
        print("-" * 40)
        return df
    except Exception as e:
        print(f"FATAL ERROR: Could not read Excel file: {e}")
        return None

def extract_geometric_properties(df):
    """
    Reads all geometric properties from the DataFrame into a dictionary.
    This function is updated to read the new properties for the Bell-Delaware method
    and provide robust defaults if they are missing.
    """
    print("--- Reading Geometric Properties ---")
    geo_props = {
        'shell_diameter': safe_read_property(df, 'Shell Diameter'),
        'shell_thickness': safe_read_property(df, 'Shell thickness'),
        'tube_outer_diameter': safe_read_property(df, 'Tube outer diameter'),
        'tube_thickness': safe_read_property(df, 'Tube thickness'),
        'tube_length': safe_read_property(df, 'Tube length'),
        'tube_pitch': safe_read_property(df, 'Tube Pitch'),
        'number_of_tubes': safe_read_property(df, 'Number of tubes'),
        'baffle_spacing': safe_read_property(df, 'Baffle spacing'),
        'number_of_passes': safe_read_property(df, 'Number of passes'),
        'baffle_cut': safe_read_property(df, 'Baffle cut %'),
        'shell_nozzle_diameter': safe_read_property(df, 'Shell Nozzle Diameter'),
        'tube_nozzle_diameter': safe_read_property(df, 'Tube Nozzle Diameter')
    }

    # --- NEW: Read Bell-Delaware specific properties with default fallbacks ---
    
    # Tube Layout (non-numeric)
    geo_props['tube_layout'] = safe_read_property(df, 'Tube Layout', is_numeric=False)
    if pd.isna(geo_props['tube_layout']):
        geo_props['tube_layout'] = 'Triangular'
        print("-> Using default Tube Layout: 'Triangular'")
        
    # Tube-Baffle Clearance (numeric)
    geo_props['tube_baffle_clearance'] = safe_read_property(df, 'Tube-Baffle Clearance (mm)')
    if pd.isna(geo_props['tube_baffle_clearance']):
        geo_props['tube_baffle_clearance'] = 0.8  # TEMA standard
        print("-> Using default Tube-Baffle Clearance: 0.8 mm")

    # Shell-Baffle Clearance (numeric)
    geo_props['shell_baffle_clearance'] = safe_read_property(df, 'Shell-Baffle Clearance (mm)')
    if pd.isna(geo_props['shell_baffle_clearance']):
        geo_props['shell_baffle_clearance'] = 3.5  # Typical value for this shell size
        print("-> Using default Shell-Baffle Clearance: 3.5 mm")

    # Number of sealing strips (numeric)
    geo_props['number_of_sealing_strips'] = safe_read_property(df, 'Number of sealing strips')
    if pd.isna(geo_props['number_of_sealing_strips']):
        geo_props['number_of_sealing_strips'] = 0  # Safest default is 0 (worst case scenario)
        print("-> Using default Number of sealing strips: 0")

    return geo_props

def save_results(df, filename):
    """Saves the final DataFrame to an Excel file."""
    try:
        df.to_excel(filename)
        print(f"\nSuccessfully saved the complete results to '{filename}'")
    except Exception as e:
        print(f"\nCould not save the file. Error: {e}")

