// static/js/report.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Load all data from storage ---
    const customerData = loadPageData('customer');
    const thermalData = loadPageData('thermal');
    const geoData = loadPageData('geometry');
    const materialsData = loadPageData('materials');
    const nozzleData = loadPageData('nozzles');
    const finalResults = loadPageData('finalResults');

    if (!customerData || !thermalData || !geoData || !materialsData ||!nozzleData || !finalResults) {
        document.querySelector('main').innerHTML = `
            <div class="error" style="display: block;">
                Error: Missing data to generate report. Please start a new calculation.
                <div class="actions"><a href="/"><button>Start Over</button></a></div>
            </div>`;
        return;
    }

    // --- Helper function to create table rows with custom precision ---
    function createRow(tbody, label, value, unit = '') {
        const row = tbody.insertRow();
        const labelCell = row.insertCell();
        const valueCell = row.insertCell();
        
        labelCell.textContent = label;

        if (value == null || value === '') {
            valueCell.textContent = 'N/A';
            return;
        }
        
        // Use a more robust check for non-numeric values
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            valueCell.textContent = value; // Display as is (e.g., material name)
            return;
        }

        const integerLabels = [
            'Shells in Series', 'Shells in Parallel', 'Number of Tubes', 'Number of Tube Passes'
        ];
        
        if (integerLabels.includes(label)) {
            valueCell.textContent = `${numValue.toFixed(0)} ${unit}`;
        } else {
            // Default formatting for other numbers
            valueCell.textContent = `${numValue.toFixed(3)} ${unit}`;
        }
    }
    
    // --- Populate Report ---
    document.getElementById('report-date').textContent = new Date().toLocaleString();

    // --- Populate Header Info Table ---
    if (customerData) {
        const headerBody = document.getElementById('header-info-table').createTBody();
        createRow(headerBody, '1. Company', customerData.cust_company);
        createRow(headerBody, '2. Location', customerData.cust_location);
        createRow(headerBody, '3. Service of Unit', customerData.cust_service);
        createRow(headerBody, '4. Item No.', customerData.cust_item_no);
        const refRow = headerBody.insertRow();
        refRow.insertCell().textContent = '5. References';
        refRow.insertCell().innerHTML = `<b>Our:</b> ${customerData.cust_our_ref}<br><b>Your:</b> ${customerData.cust_your_ref}`;
        const jobRow = headerBody.insertRow();
        jobRow.insertCell().textContent = '6. Job/Rev';
        jobRow.insertCell().innerHTML = `<b>Job No:</b> ${customerData.cust_job_no}<br><b>Rev No:</b> ${customerData.cust_rev_no}`;
    }

    // 1. Thermal Data
    const shellThermalBody = document.getElementById('shell-thermal-table').createTBody();
    const tubeThermalBody = document.getElementById('tube-thermal-table').createTBody();
    const overallThermalBody = document.getElementById('overall-thermal-table').createTBody();
    
    // --- THIS IS THE FIX ---
    // Read the user's selected unit from thermalData instead of hardcoding it.
    const flowUnit = thermalData.flowrate_unit || 'N/A';
    const foulingUnit = thermalData.fouling_factor_unit || 'm²K/W';
    const heatLoadUnit = thermalData.heat_load_unit || 'kW';
    const pressureUnit = thermalData.design_pressure_unit || 'bar';
    const tempUnit = thermalData.design_temperature_unit || '°C';
    const temperatureUnit = thermalData.temperature_unit || '°C';


    createRow(shellThermalBody, 'Fluid Name', thermalData.shell_fluid_name);
    createRow(shellThermalBody, 'Flow Rate', thermalData.shell_flowrate, flowUnit);
    createRow(shellThermalBody, 'Inlet Temperature', thermalData.shell_inlet_temp, temperatureUnit);
    createRow(shellThermalBody, 'Outlet Temperature', thermalData.shell_outlet_temp, temperatureUnit);
    createRow(shellThermalBody, 'Fouling Factor', thermalData.shell_fouling, foulingUnit);
    
    createRow(tubeThermalBody, 'Fluid Name', thermalData.tube_fluid_name);
    createRow(tubeThermalBody, 'Flow Rate', thermalData.tube_flowrate, flowUnit);
    createRow(tubeThermalBody, 'Inlet Temperature', thermalData.tube_inlet_temp, temperatureUnit);
    createRow(tubeThermalBody, 'Outlet Temperature', thermalData.tube_outlet_temp, temperatureUnit);
    createRow(tubeThermalBody, 'Fouling Factor', thermalData.tube_fouling, foulingUnit);

    createRow(overallThermalBody, 'Total Heat Duty (Q)', thermalData.heat_load, heatLoadUnit);

    // 2. Geometry Data
    const shellGeoBody = document.getElementById('shell-geo-table').createTBody();
    createRow(shellGeoBody, 'TEMA Type', `${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type}`);
    createRow(shellGeoBody, 'Shells in Series', geoData.shells_in_series);
    createRow(shellGeoBody, 'Shells in Parallel', geoData.shells_in_parallel);
    createRow(shellGeoBody, 'Shell Inner Diameter', geoData.shell_diameter, 'mm');
    createRow(shellGeoBody, 'Shell Thickness', geo_data.shell_thickness, 'mm');
    createRow(shellGeoBody, 'Design Pressure', thermalData.shell_design_pressure, pressureUnit);
    createRow(shellGeoBody, 'Design Temperature', thermalData.shell_design_temp, tempUnit);
    createRow(shellGeoBody, 'Corrosion Allowance', thermalData.shell_corr_allow, 'mm');
    createRow(shellGeoBody, 'Orientation', geoData.orientation);
    
    const tubeGeoBody = document.getElementById('tube-geo-table').createTBody();
    createRow(tubeGeoBody, 'Number of Tubes', geoData.num_tubes);
    createRow(tubeGeoBody, 'Number of Tube Passes', geoData.num_passes);
    createRow(tubeGeoBody, 'Tube Outer Diameter', geoData.tube_od, 'mm');
    createRow(tubeGeoBody, 'Tube Thickness', geoData.tube_thickness, 'mm');
    createRow(tubeGeoBody, 'Tube Length', geoData.tube_length, 'm');
    createRow(tubeGeoBody, 'Tube Pitch', geoData.tube_pitch, 'mm');
    createRow(tubeGeoBody, 'Tube Layout', geoData.tube_layout);
    createRow(tubeGeoBody, 'Baffle Spacing', geoData.baffle_spacing, 'mm');
    createRow(tubeGeoBody, 'Baffle Cut', geoData.baffle_cut, '%');

    // 3. Materials Data
    if (materialsData) {
        const matBody = document.getElementById('materials-table').createTBody();
        createRow(matBody, 'Shell Cylinder', materialsData.mat_shell_cylinder);
        createRow(matBody, 'Channel Cover / Bonnet', materialsData.mat_shell_bonnet);
        createRow(matBody, 'Shell Nozzles', materialsData.mat_shell_nozzles);
        createRow(matBody, 'Baffles', materialsData.mat_baffles);
        createRow(matBody, 'Tubesheet', materialsData.mat_tubesheet);
        createRow(matBody, 'Tubes', materialsData.mat_tube);
        createRow(matBody, 'Tube Side Channel', materialsData.mat_tube_channel);
        createRow(matBody, 'Tube Side Nozzles', materialsData.mat_tube_nozzles);
        createRow(matBody, 'Pass Partition Plates', materialsData.mat_pass_plates);
        createRow(matBody, 'Shell Gasket', materialsData.mat_shell_gasket);
        createRow(matBody, 'Tube Side Gasket', materialsData.mat_tube_gasket);
        createRow(matBody, 'Bolting (Studs/Nuts)', materialsData.mat_bolting);
    }
    
    // 4. Nozzle Schedule
    if (nozzleData) {
        const nozzleBody = document.getElementById('nozzles-table').createTBody();
        if (nozzleData.shell?.inlet) {
            createRow(nozzleBody, 'Shell Inlet NPS / Sch', `${nozzleData.shell.inlet.nps} / ${nozzleData.shell.inlet.sch}`);
            createRow(nozzleBody, 'Shell Inlet ID', nozzleData.shell.inlet.id_mm, 'mm');
        }
        if (nozzleData.shell?.outlet) {
            createRow(nozzleBody, 'Shell Outlet NPS / Sch', `${nozzleData.shell.outlet.nps} / ${nozzleData.shell.outlet.sch}`);
            createRow(nozzleBody, 'Shell Outlet ID', nozzleData.shell.outlet.id_mm, 'mm');
        }
        if (nozzleData.shell?.intermediate) {
             createRow(nozzleBody, 'Shell Intermediate NPS / Sch', `${nozzleData.shell.intermediate.nps} / ${nozzleData.shell.intermediate.sch}`);
            createRow(nozzleBody, 'Shell Intermediate ID', nozzleData.shell.intermediate.id_mm, 'mm');
        }
        if (nozzleData.tube?.inlet) {
            createRow(nozzleBody, 'Tube Inlet NPS / Sch', `${nozzleData.tube.inlet.nps} / ${nozzleData.tube.inlet.sch}`);
            createRow(nozzleBody, 'Tube Inlet ID', nozzleData.tube.inlet.id_mm, 'mm');
        }
        if (nozzleData.tube?.outlet) {
            createRow(nozzleBody, 'Tube Outlet NPS / Sch', `${nozzleData.tube.outlet.nps} / ${nozzleData.tube.outlet.sch}`);
            createRow(nozzleBody, 'Tube Outlet ID', nozzleData.tube.outlet.id_mm, 'mm');
        }
    }
    
    // 5. Final Results
    const bdResultsBody = document.getElementById('bd-results-table').createTBody();
    createRow(bdResultsBody, 'Overall U (Clean)', finalResults.bd_u_clean, 'W/m²K');
    createRow(bdResultsBody, 'Overall U (Dirty)', finalResults.bd_u_dirty, 'W/m²K');
    createRow(bdResultsBody, 'Shell Side dP', finalResults.bd_dp_shell, 'kPa');
    createRow(bdResultsBody, 'Tube Side dP', finalResults.kern_dp_tube, 'kPa');

    // 6. Design Summary
    const summaryData = finalResults.design_summary;
    if (summaryData) {
        const summaryBody = document.getElementById('design-summary-table').createTBody();
        createRow(summaryBody, 'Log Mean Temp. Difference (LMTD)', summaryData.lmtd, '°C');
        createRow(summaryBody, 'Actual Area Provided (A_actual)', summaryData.A_actual, 'm²');
        createRow(summaryBody, 'Service Rate Required (U_service)', summaryData.U_service_rate, 'W/m²K');
        createRow(summaryBody, 'Calculated U (Dirty)', finalResults.bd_u_dirty, 'W/m²K');
        createRow(summaryBody, 'Overdesign / Margin', summaryData.margin_bd, '%');

        let bdStatus = 'N/A';
        let bdStatusClass = '';
         if (finalResults.bd_u_dirty != null && summaryData.U_service_rate != null) {
            if (finalResults.bd_u_dirty >= summaryData.U_service_rate) {
                bdStatus = 'Design is Adequate';
                bdStatusClass = 'status-ok';
            } else {
                bdStatus = 'Design is Undersized';
                bdStatusClass = 'status-high';
            }
        }
        const bdStatusRow = summaryBody.insertRow();
        bdStatusRow.insertCell().textContent = 'Status (Bell-Delaware)';
        const bdStatusCell = bdStatusRow.insertCell();
        bdStatusCell.textContent = bdStatus;
        bdStatusCell.className = bdStatusClass;
    }

    // 7. Shell-Side Flow Distribution
    const fractionData = finalResults.flow_fractions;
    if (fractionData && Object.keys(fractionData).length > 0) {
        const flowBody = document.getElementById('flow-dist-table').createTBody();
        const streamLabels = {
            'B_fraction': 'Main Cross-Flow (B)', 'C_fraction': 'Bundle-to-Shell Bypass (C)',
            'A_fraction': 'Tube-to-Baffle Leakage (A)', 'E_fraction': 'Baffle-to-Shell Leakage (E)',
            'F_fraction': 'Pass-Partition Bypass (F)'
        };
        const displayOrder = ['B_fraction', 'C_fraction', 'A_fraction', 'E_fraction', 'F_fraction'];

        for (const key of displayOrder) {
            if (fractionData[key] != null) {
                createRow(flowBody, streamLabels[key], (fractionData[key] * 100).toFixed(1), '%');
            }
        }
        
        let problems = [];
        const b_fraction = fractionData.B_fraction || 0;
        const advice = {
            C_fraction: "Reduce bundle-to-shell bypass (consider adding sealing strips).",
            A_fraction: "Reduce tube-to-baffle clearance.",
            E_fraction: "Reduce baffle-to-shell clearance.",
            F_fraction: "Revise tube layout to minimize pass-partition lanes."
        };
        const thresholds = { C_fraction: 0.20, A_fraction: 0.20, E_fraction: 0.15, F_fraction: 0.15 };

        for (const key in thresholds) {
            if (fractionData[key] > thresholds[key]) {
                problems.push(advice[key]);
            }
        }
        if (b_fraction < 0.35 && problems.length === 0) {
            problems.push("Main cross-flow is critically low. Overall geometry is inefficient.");
        }
        
        const statusRow = flowBody.insertRow();
        statusRow.insertCell().textContent = 'Flow Distribution Status';
        const statusValueCell = statusRow.insertCell();
        if (problems.length === 0) {
            statusValueCell.textContent = 'Good Flow Distribution';
            statusValueCell.className = 'status-ok';
        } else {
            let recommendationsHTML = '<strong class="status-high">Poor Distribution - High Bypass/Leakage</strong><ul style="margin: 5px 0 0 20px; padding: 0; text-align: left;">';
            new Set(problems).forEach(p => { recommendationsHTML += `<li>${p}</li>`; });
            recommendationsHTML += '</ul>';
            statusValueCell.innerHTML = recommendationsHTML;
        }
    }

    // 8. Design & Safety Checks
    const checksBody = document.getElementById('checks-table').createTBody();
    const momentumData = finalResults.design_checks?.momentum;
    if (momentumData) {
        const labels = {
            shell_inlet: 'Shell Inlet Momentum (ρv²)', shell_outlet: 'Shell Outlet Momentum (ρv²)',
            shell_intermediate: 'Shell Intermediate Momentum (ρv²)', tube_inlet: 'Tube Inlet Momentum (ρv²)',
            tube_outlet: 'Tube Outlet Momentum (ρv²)'
        };
        
        for (const key in momentumData) {
            if (labels[key]) {
                const check = momentumData[key];
                const value = check.value;
                const limit = check.limit;
                let status = 'N/A';
                let statusClass = '';

                if (value != null && limit != null) {
                    if (value <= limit) {
                        status = `OK (Limit: ${limit} Pa)`;
                        statusClass = 'status-ok';
                    } else {
                        status = (key === 'shell_inlet') 
                            ? `High - Impingement Plate Required (Limit: ${limit} Pa)`
                            : `High - Revise Nozzle/Flow Design (Limit: ${limit} Pa)`;
                        statusClass = 'status-high';
                    }
                }
                
                const valueRow = checksBody.insertRow();
                valueRow.insertCell().textContent = labels[key];
                valueRow.insertCell().textContent = (value != null) ? `${parseFloat(value).toFixed(2)} Pa` : 'N/A';
                
                const statusRow = checksBody.insertRow();
                statusRow.insertCell().textContent = 'Status';
                const statusCell = statusRow.insertCell();
                statusCell.textContent = status;
                statusCell.className = statusClass;
            }
        }
    }
});