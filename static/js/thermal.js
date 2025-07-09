// static/js/thermal.js

document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENT SELECTORS (using a helper for cleaner code) ---
    const getEl = (id) => document.getElementById(id);

    const inputs = {
        shell_fluid_name: getEl('shell_fluid_name'), tube_fluid_name: getEl('tube_fluid_name'),
        shell_flowrate: getEl('shell_flowrate'), tube_flowrate: getEl('tube_flowrate'),
        shell_inlet_temp: getEl('shell_inlet_temp'), shell_outlet_temp: getEl('shell_outlet_temp'),
        tube_inlet_temp: getEl('tube_inlet_temp'), tube_outlet_temp: getEl('tube_outlet_temp'),
        shell_fouling: getEl('shell_fouling'), tube_fouling: getEl('tube_fouling'),
        shell_design_pressure: getEl('shell_design_pressure'), tube_design_pressure: getEl('tube_design_pressure'),
        shell_design_temp: getEl('shell_design_temp'), tube_design_temp: getEl('tube_design_temp'),
        shell_corr_allow: getEl('shell_corr_allow'), tube_corr_allow: getEl('tube_corr_allow'),
        heat_load: getEl('heat_load'),
        asme_code: getEl('asme_code'), TEMA_class: getEl('tema_class'),
        asme_code1:getEl('asme_code'),
        // Readonly fields
        shell_inlet_density: getEl('shell_inlet_density'), shell_outlet_density: getEl('shell_outlet_density'),
        shell_inlet_viscosity: getEl('shell_inlet_viscosity'), shell_outlet_viscosity: getEl('shell_outlet_viscosity'),
        shell_inlet_cp: getEl('shell_inlet_cp'), shell_outlet_cp: getEl('shell_outlet_cp'),
        shell_inlet_k: getEl('shell_inlet_k'), shell_outlet_k: getEl('shell_outlet_k'),
        tube_inlet_density: getEl('tube_inlet_density'), tube_outlet_density: getEl('tube_outlet_density'),
        tube_inlet_viscosity: getEl('tube_inlet_viscosity'), tube_outlet_viscosity: getEl('tube_outlet_viscosity'),
        tube_inlet_cp: getEl('tube_inlet_cp'), tube_outlet_cp: getEl('tube_outlet_cp'),
        tube_inlet_k: getEl('tube_inlet_k'), tube_outlet_k: getEl('tube_outlet_k'),
        bulk_temp_hot: getEl('bulk_temp_hot'), bulk_temp_cold: getEl('bulk_temp_cold'), wall_temp: getEl('wall_temp'),
        
        // Controls
        solveBtn: getEl('solve-btn'), errorDiv: getEl('error-message')
    };

    // --- HELPER FUNCTIONS ---

    function convertToSI(value, unit) {
        if (isNaN(value)) return value;
        switch(unit) {
            // Flow Rate
            case 'm3/h': return value / 3600;
            case 'lpm': return value / 60000;
            // Temperature
            case 'F': return (value - 32) * 5 / 9;
            // Pressure
            case 'psi': return value / 14.5038; // to bar
            case 'kPa': return value / 100;    // to bar
            // Heat Load
            case 'kcal/h': return value * 0.001163; // to kW
            // *** CRITICAL FIX: The conversion factor was inverted. ***
            // 1 m²h°C/kcal = 1.163 m²K/W. The old factor was 0.86 (1/1.163).
            case 'm2hC/kcal': return value * 1.163; // to m²K/W
            // Default cases (already SI)
            case 'm3/s':
            case 'C':
            case 'bar':
            case 'kW':
            case 'm2K/W':
            default: return value;
        }
    }

    // In static/js/thermal.js

// ... after the convertToSI function ...

function convertFromSI(value, unit) {
    if (isNaN(value)) return value;
    switch(unit) {
        // Flow Rate
        case 'm3/h': return value * 3600;
        case 'lpm': return value * 60000;
        // Temperature
        case 'F': return (value * 9 / 5) + 32;
        // Pressure (from bar)
        case 'psi': return value * 14.5038;
        case 'kPa': return value * 100;
        // Heat Load (from kW)
        case 'kcal/h': return value / 0.001163;
        // Fouling Factor (from m²K/W)
        case 'm2hC/kcal': return value / 1.163;
        // Default (already in the target unit)
        default: return value;
    }
}

 // *** NEW: HELPER FUNCTION FOR FORMATTING FOULING FACTOR TO 6 DECIMAL PLACES ***
function formatFoulingValue(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value; // Return original if not a number
    // Use toFixed(6) to ensure exactly 6 decimal places.
    return num.toFixed(6);
}

    function collectThermalData() {
        const formData = {};
        const flowrateUnit = getEl('flowrate_unit').value;
        const temperatureUnit = getEl('temperature_unit').value;
        const foulingUnit = getEl('fouling_factor_unit').value;
        const designPressureUnit = getEl('design_pressure_unit').value;
        const designTempUnit = getEl('design_temperature_unit').value;
        const heatLoadUnit = getEl('heat_load_unit').value;

        const processField = (valueEl, multEl, unit) => {
            const valStr = valueEl.value.trim();
            if (valStr === '') return ''; // Return empty string if input is empty
            const val = parseFloat(valStr);
            if (isNaN(val)) return valueEl.value; // Return original string if not a number

            const mult = multEl ? parseFloat(multEl.value) || 1 : 1;
            const finalValue = val * mult;
            return unit ? convertToSI(finalValue, unit) : finalValue;
        };

        formData.shell_fluid_name = inputs.shell_fluid_name.value;
        formData.tube_fluid_name = inputs.tube_fluid_name.value;
        formData.shell_flowrate = processField(inputs.shell_flowrate, getEl('shell_flowrate_mult'), flowrateUnit);
        formData.tube_flowrate = processField(inputs.tube_flowrate, getEl('tube_flowrate_mult'), flowrateUnit);
        formData.shell_inlet_temp = processField(inputs.shell_inlet_temp, null, temperatureUnit);
        formData.shell_outlet_temp = processField(inputs.shell_outlet_temp, null, temperatureUnit);
        formData.tube_inlet_temp = processField(inputs.tube_inlet_temp, null, temperatureUnit);
        formData.tube_outlet_temp = processField(inputs.tube_outlet_temp, null, temperatureUnit);
        formData.heat_load = processField(inputs.heat_load, getEl('heat_load_mult'), heatLoadUnit);

        // *** FIX: Pass fouling factor through the same robust processing ***
        // This ensures correct conversion from the selected unit to SI (m²K/W)
        formData.shell_fouling = processField(inputs.shell_fouling, null, foulingUnit);
        formData.tube_fouling = processField(inputs.tube_fouling, null, foulingUnit);

        formData.shell_corr_allow = inputs.shell_corr_allow.value;
        formData.tube_corr_allow = inputs.tube_corr_allow.value;
        formData.shell_design_pressure = processField(inputs.shell_design_pressure, null, designPressureUnit);
        formData.tube_design_pressure = processField(inputs.tube_design_pressure, null, designPressureUnit);
        formData.shell_design_temp = processField(inputs.shell_design_temp, null, designTempUnit);
        formData.tube_design_temp = processField(inputs.tube_design_temp, null, designTempUnit);

        return formData;
    }

    // Key inputs that trigger clearing of calculated fields
    const keyInputIds = [
        'shell_fluid_name', 'shell_inlet_temp', 'shell_outlet_temp', 'shell_flowrate', 'shell_fouling',
        'tube_fluid_name', 'tube_inlet_temp', 'tube_outlet_temp', 'tube_flowrate', 'tube_fouling',
        'heat_load', 'flowrate_unit', 'temperature_unit', 'heat_load_unit', 'fouling_factor_unit'
    ];

    function clearCalculatedFields() {
        inputs.bulk_temp_hot.value = '';
        inputs.bulk_temp_cold.value = '';
        inputs.wall_temp.value = '';
    }

    function saveThermalData() {
        const rawData = {};
        document.querySelectorAll('input, select').forEach(el => {
            if (el.id) rawData[el.id] = el.value;
        });
        saveData('thermal', rawData);
    }

    function showError(message) {
        inputs.errorDiv.textContent = message;
        inputs.errorDiv.style.display = message ? 'block' : 'none';
    }

    async function handlePropertyFetch(event) {
        // ... (this function is good, no changes needed)
        if (!event || !event.target) return;
        const tempInputId = event.target.id.includes('temp') ? event.target.id : null;
        if (!tempInputId) return;

        const tempEl = getEl(tempInputId);
        const temperatureUnit = getEl('temperature_unit').value;
        const side = tempInputId.split('_')[0];
        const point = tempInputId.includes('inlet') ? 'inlet' : 'outlet';
        const fluidNameEl = inputs[`${side}_fluid_name`];

        if (!fluidNameEl || !fluidNameEl.value || !tempEl || !tempEl.value) return;
        const tempInC = convertToSI(parseFloat(tempEl.value), temperatureUnit);
        if (isNaN(tempInC)) return;

        try {
            const response = await fetch(`/api/fluid-properties?fluid_name=${fluidNameEl.value}&temp=${tempInC}`);
            if (!response.ok) throw new Error('Failed to fetch properties.');
            const properties = await response.json();
            inputs[`${side}_${point}_density`].value = Number(properties.density).toFixed(2);
            inputs[`${side}_${point}_viscosity`].value = Number(properties.viscosity).toFixed(3);
            inputs[`${side}_${point}_cp`].value = Number(properties.cp).toFixed(3);
            inputs[`${side}_${point}_k`].value = Number(properties.conductivity).toFixed(3);
        } catch (error) { console.error(`Error fetching properties for ${event.target.id}:`, error); }
    }
// In static/js/thermal.js

// REPLACE the entire solveThermalBalance function with this one
async function solveThermalBalance() {
    try {
        showError('');

        // 1. Record which fields are blank. We will only update these.
        const fieldsToSolve = {
            shell_flowrate: inputs.shell_flowrate.value.trim() === '',
            tube_flowrate: inputs.tube_flowrate.value.trim() === '',
            shell_outlet_temp: inputs.shell_outlet_temp.value.trim() === '',
            tube_outlet_temp: inputs.tube_outlet_temp.value.trim() === '',
            heat_load: inputs.heat_load.value.trim() === '',
        };

        // 2. Collect data and convert TO SI for the backend
        const dataToSend = collectThermalData();

        const response = await fetch('/api/solve-thermal-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        const result = await response.json(); // Server returns all results in SI units
        if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');

        // 3. Update ONLY the fields that were originally blank
        // Convert the SI result FROM the server back to the user's selected unit for display
        for (const key in fieldsToSolve) {
            if (fieldsToSolve[key] && result[key] != null) {
                const siValue = result[key];
                let displayValue = siValue;
                let unit = '';

                // Find the correct unit for conversion
                if (key.includes('flowrate')) unit = getEl('flowrate_unit').value;
                if (key.includes('temp')) unit = getEl('temperature_unit').value;
                if (key.includes('heat_load')) unit = getEl('heat_load_unit').value;
                
                // Convert from SI to the display unit
                if (unit) {
                    displayValue = convertFromSI(siValue, unit);
                }

                // Apply appropriate formatting
                if (key.includes('temp')) displayValue = Number(displayValue).toFixed(2);
                if (key.includes('flowrate')) displayValue = Number(displayValue).toFixed(6); // More precision for small flowrates
                if (key.includes('heat_load')) displayValue = Number(displayValue).toFixed(3);
                
                inputs[key].value = displayValue;
            }
        }
        
        // 4. Update readonly fields (these are always in °C, no conversion needed)
        if (result.bulk_temp_hot != null) inputs.bulk_temp_hot.value = Number(result.bulk_temp_hot).toFixed(2);
        if (result.bulk_temp_cold != null) inputs.bulk_temp_cold.value = Number(result.bulk_temp_cold).toFixed(2);
        if (result.wall_temp != null) inputs.wall_temp.value = Number(result.wall_temp).toFixed(2);
        
        // 5. Re-fetch fluid properties for any newly calculated temperatures
        if (fieldsToSolve.shell_outlet_temp) await handlePropertyFetch({ target: inputs.shell_outlet_temp });
        if (fieldsToSolve.tube_outlet_temp) await handlePropertyFetch({ target: inputs.tube_outlet_temp });

        // 6. Save the form's current state (which now preserves user inputs) and proceed
        resetSubsequentData();
        saveThermalData();
        window.location.href = '/geometry';

    } catch (error) {
        showError(error.message);
    }
}

    function populateFormOnLoad() {
        const storedData = loadPageData('thermal');
        if (storedData) {
            for (const key in storedData) {
                const element = getEl(key);
                if (element) {
                    let value = storedData[key];
                    // *** FIX: Format fouling factor on load to handle small numbers ***
                    if (key === 'shell_fouling' || key === 'tube_fouling') {
                        value = formatFoulingValue(value);
                    }
                    element.value = value;
                }
            }
        }
        ['shell_inlet_temp', 'shell_outlet_temp', 'tube_inlet_temp', 'tube_outlet_temp'].forEach(id => {
            if (getEl(id) && getEl(id).value) handlePropertyFetch({ target: getEl(id) });
        });
    }

    // --- EVENT LISTENERS ---
    getEl('thermal-form').addEventListener('change', (event) => {
        const id = event.target.id;
        if (id.includes('temp') || id.includes('fluid_name') || id === 'temperature_unit') {
             ['shell_inlet_temp', 'shell_outlet_temp', 'tube_inlet_temp', 'tube_outlet_temp'].forEach(tempId => {
                if (getEl(tempId) && getEl(tempId).value) handlePropertyFetch({ target: getEl(tempId) });
            });
        }
        if (keyInputIds.includes(id)) {
            clearCalculatedFields();
        }
    });

    // *** NEW: Add blur event listeners for live formatting of fouling factor ***
    getEl('shell_fouling').addEventListener('blur', e => {
        e.target.value = formatFoulingValue(e.target.value);
    });
    getEl('tube_fouling').addEventListener('blur', e => {
        e.target.value = formatFoulingValue(e.target.value);
    });

    inputs.solveBtn.addEventListener('click', solveThermalBalance);

    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('active')) {
                e.preventDefault();
                saveThermalData();
                window.location.href = e.target.href;
            }
        });
    });

    // --- INITIALIZATION ---
    populateFormOnLoad();
});