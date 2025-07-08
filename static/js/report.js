
// static/js/report.js

document.addEventListener('DOMContentLoaded', function() {
        const customerData = loadPageData('customer'); // Load new data

    // --- Load all data from storage ---
    const thermalData = loadPageData('thermal');
    const geoData = loadPageData('geometry');
    const materialsData = loadPageData('materials');
    const nozzleData = loadPageData('nozzles');
    const finalResults = loadPageData('finalResults');
    const flow_props = loadPageData('flow_paras');
    // const results = loadPageData('results');


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

        if (value == null) {
            valueCell.textContent = 'N/A';
            return;
        }

        // --- MODIFIED: Custom precision logic ---
        if (label.toLowerCase().includes('flow rate') || label.toLowerCase().includes('fouling factor')) {
            // Display these values exactly as they are, without rounding.
            valueCell.textContent = `${value} ${unit}`;
        } else {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                // If it's not a number (e.g., a material name or 'BEU'), display as is.
                valueCell.textContent = value;
            } else {
                // --- NEW: Check for labels that should be whole numbers ---
                const integerLabels = [
                    'Shells in Series',
                    'Shells in Parallel',
                    'Number of Tubes',
                    'Number of Tube Passes',
                    'Reynolds No.'
                ];
                
                if (integerLabels.includes(label)) {
                    // Format as a whole number without decimals
                    valueCell.textContent = `${numValue.toFixed(0)} ${unit}`;
                } else {
                    // Default formatting for other numbers (e.g., dimensions, temperatures)
                    valueCell.textContent = `${numValue.toFixed(3)} ${unit}`;
                }
            }
        }
    }
    
    // --- Populate Report ---
    document.getElementById('report-date').textContent = new Date().toLocaleString();


        // --- NEW: Populate Header Info Table ---
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
    createRow(shellThermalBody, 'Fluid Name', thermalData.shell_fluid_name);
    createRow(shellThermalBody, 'Flow Rate', thermalData.shell_flowrate, thermalData.flowrate_unit, 'm3/s');
    createRow(shellThermalBody, 'Inlet Temperature', thermalData.shell_inlet_temp, '°C');
    createRow(shellThermalBody, 'Outlet Temperature', thermalData.shell_outlet_temp, '°C');
    createRow(shellThermalBody, 'Fouling Factor', thermalData.shell_fouling, 'm²h°C/kcal');
    createRow(shellThermalBody, 'Reynolds No.', finalResults.Re_shell, '');
    createRow(shellThermalBody, 'Prandtl No.', finalResults.Pr_shell, '');

        // --- NEW: Add Shell-Side Performance Data ---
    // createRow(shellThermalBody, 'Velocity', performanceData.shell_velocity, 'm/s');
    // createRow(shellThermalBody, 'Reynolds No.', performanceData.shell_reynolds, '');
    // createRow(shellThermalBody, 'Reynolds No.', finalResults.shell_reynolds, '');
    
    const tubeThermalBody = document.getElementById('tube-thermal-table').createTBody();
    createRow(tubeThermalBody, 'Fluid Name', thermalData.tube_fluid_name);
    createRow(tubeThermalBody, 'Flow Rate', thermalData.tube_flowrate, thermalData.flowrate_unit, 'm3/s');
    // createRow(tubeThermalBody, 'Flow Rate', thermalData.tube_flowrate, final_results.unit);
    // createRow(tubeThermalBody, 'Flow Rate', thermalData.tube_flowrate, 'm³/s');
    createRow(tubeThermalBody, 'Inlet Temperature', thermalData.tube_inlet_temp, '°C');
    createRow(tubeThermalBody, 'Outlet Temperature', thermalData.tube_outlet_temp, '°C');
    createRow(tubeThermalBody, 'Fouling Factor', thermalData.tube_fouling, 'm²h°C/kcal');
    createRow(tubeThermalBody, 'Reynolds No.', finalResults.Re_tube, '');
    createRow(tubeThermalBody, 'Prandtl No.', finalResults.Pr_tube, '');


    const overallThermalBody = document.getElementById('overall-thermal-table').createTBody();
    createRow(overallThermalBody, 'Total Heat Duty (Q)', thermalData.heat_load, 'kW');

    // 2. Geometry Data
    const shellGeoBody = document.getElementById('shell-geo-table').createTBody();
    createRow(shellGeoBody, 'TEMA Type', `${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type}`);
    createRow(shellGeoBody, 'Shells in Series', geoData.shells_in_series);
    createRow(shellGeoBody, 'Shells in Parallel', geoData.shells_in_parallel);
    createRow(shellGeoBody, 'Shell Inner Diameter', geoData.shell_diameter, 'mm');
    createRow(shellGeoBody, 'Shell Thickness', geoData.shell_thickness, 'mm');
            // --- ADD THESE ---
    createRow(shellGeoBody, 'Design Pressure', thermalData.shell_design_pressure, 'bar');
    createRow(shellGeoBody, 'Design Temperature', thermalData.shell_design_temp, '°C');
    createRow(shellGeoBody, 'Corrosion Allowance', thermalData.shell_corr_allow, 'mm');
    createRow(shellGeoBody, 'Orientation', geoData.orientation);
    // createRow(shellGeoBody, 'Shells in Series', geoData.shells_in_series);

    
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
        // Target the single new table body for all materials
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
        // Target the single new table body for all nozzles
        const nozzleBody = document.getElementById('nozzles-table').createTBody();
        if (nozzleData.shell?.inlet) {
            createRow(nozzleBody, 'Shell Inlet NPS (in)', `${nozzleData.shell.inlet.nps} / ${nozzleData.shell.inlet.sch}`);
            createRow(nozzleBody, 'Shell Inlet ID (mm)', nozzleData.shell.inlet.id_mm, 'mm');
        }
        if (nozzleData.shell?.outlet) {
            createRow(nozzleBody, 'Shell Outlet NPS  (in)', `${nozzleData.shell.outlet.nps} / ${nozzleData.shell.outlet.sch}`);
            createRow(nozzleBody, 'Shell Outlet ID (mm)', nozzleData.shell.outlet.id_mm, 'mm');
        }
        if (nozzleData.shell?.intermediate) {
             createRow(nozzleBody, 'Shell Intermediate NPS  (in)', `${nozzleData.shell.intermediate.nps} / ${nozzleData.shell.intermediate.sch}`);
            createRow(nozzleBody, 'Shell Intermediate ID (mm)', nozzleData.shell.intermediate.id_mm, 'mm');
        }
        if (nozzleData.tube?.inlet) {
            createRow(nozzleBody, 'Tube Inlet NPS (in)', `${nozzleData.tube.inlet.nps} / ${nozzleData.tube.inlet.sch}`);
            createRow(nozzleBody, 'Tube Inlet ID (mm)', nozzleData.tube.inlet.id_mm, 'mm');
        }
        if (nozzleData.tube?.outlet) {
            createRow(nozzleBody, 'Tube Outlet NPS (in)', `${nozzleData.tube.outlet.nps} / ${nozzleData.tube.outlet.sch}`);
            createRow(nozzleBody, 'Tube Outlet ID (mm)', nozzleData.tube.outlet.id_mm, 'mm');
        }
    }
    
    // 4. Final Results
    // const kernResultsBody = document.getElementById('kern-results-table').createTBody();
    // createRow(kernResultsBody, 'Overall U (Clean)', finalResults.kern_u_clean, 'W/m²K');
    // createRow(kernResultsBody, 'Overall U (Dirty)', finalResults.kern_u_dirty, 'W/m²K');
    // createRow(kernResultsBody, 'Shell Side dP', finalResults.kern_dp_shell, 'kPa');
    // createRow(kernResultsBody, 'Tube Side dP', finalResults.kern_dp_tube, 'kPa');

    const bdResultsBody = document.getElementById('bd-results-table').createTBody();
    createRow(bdResultsBody, 'Overall U (Clean)', finalResults.u_clean, 'W/m²K');
    // createRow(bdResultsBody, 'Overall U (Clean)', finalResults.bd_u_clean, 'W/m²K');
    createRow(bdResultsBody, 'Overall U (Dirty)', finalResults.u_dirty, 'W/m²K');
    // createRow(bdResultsBody, 'Overall U (Dirty)', finalResults.bd_u_dirty, 'W/m²K');

    
    // createRow(kernResultsBody, 'Shell Side dP', finalResults.kern_dp_shell, 'kPa');

    createRow(bdResultsBody, 'Shell Side dP', finalResults.dp_shell,'kPa');
    // createRow(bdResultsBody, 'Shell Side dP', ((finalResults.bd_dp_shell)+(finalResults.kern_dp_shell)), 'kPa');
    createRow(bdResultsBody, 'Tube Side dP', finalResults.kern_dp_tube, 'kPa');
    // createRow(bdResultsBody, 'U Service', finalResults.U_service, 'kPa');


    // //     // Add Service Rate to the Kern table for a single point of reference
    // if (finalResults.design_summary && finalResults.design_summary.U_service_rate != null) {
    //     // Add a spacer row for visual separation
    //     kernResultsBody.insertRow().innerHTML = `<td colspan="2" style="background-color: #f8f9fa;"> </td>`;
    //     // Add the service rate row
    //     createRow(kernResultsBody, 'Service Rate Required', finalResults.design_summary.U_service_rate, 'W/m²K');
    // }
// in static/js/report.js

    // ... after the Final Results section ...

    // 5. Design Summary
    const summaryData = finalResults.design_summary;
    if (summaryData) {
        const summaryBody = document.getElementById('design-summary-table').createTBody();
        createRow(summaryBody, 'Log Mean Temp. Difference (LMTD)', summaryData.lmtd, '°C');
        createRow(summaryBody, 'Actual Area Provided (A_actual)', summaryData.A_actual, 'm²');
        createRow(summaryBody, 'Required Area (A_req)', summaryData.A_req, 'm²');
        createRow(summaryBody, 'Service Rate Required (U_service)', summaryData.U_service_rate, 'W/m²K');
        
        // // --- KERN METHOD SUMMARY & STATUS ---
        // summaryBody.insertRow().innerHTML = `<td colspan="2" style="background-color: #f8f9fa; font-weight: 500; text-align: center;">Kern Method Verification</td>`;
        // createRow(summaryBody, 'Calculated U (Dirty)', finalResults.kern_u_dirty, 'W/m²K');
        // createRow(summaryBody, 'Overdesign / Margin', summaryData.margin_kern, '%');
        
        // // Add Kern Status Row
        // let kernStatus = 'N/A';
        // let kernStatusClass = '';
        // if (finalResults.kern_u_dirty != null && summaryData.U_service_rate != null) {
        //     if (finalResults.kern_u_dirty >= summaryData.U_service_rate) {
        //         kernStatus = 'Design is Adequate';
        //         kernStatusClass = 'status-ok';
        //     } else {
        //         kernStatus = 'Design is Undersized';
        //         kernStatusClass = 'status-high';
        //     }
        // }
        // const kernStatusRow = summaryBody.insertRow();
        // kernStatusRow.insertCell().textContent = 'Status (Kern)';
        // const kernStatusCell = kernStatusRow.insertCell();
        // kernStatusCell.textContent = kernStatus;
        // kernStatusCell.className = kernStatusClass;
        
        // --- BELL-DELAWARE METHOD SUMMARY & STATUS ---
        // summaryBody.insertRow().innerHTML = `<td colspan="2" style="background-color: #f8f9fa; font-weight: 500; text-align: center;">Bell-Delaware Method Verification</td>`;
        // createRow(summaryBody, 'Calculated U (Dirty)', finalResults.bd_u_dirty, 'W/m²K');
        createRow(summaryBody, 'Calculated U (Dirty)', finalResults.u_dirty, 'W/m²K');
        createRow(summaryBody, 'Overdesign / Margin', summaryData.margin_bd, '%');

        // Add Bell-Delaware Status Row
        let bdStatus = 'N/A';
        let bdStatusClass = '';
         if (finalResults.u_dirty != null && summaryData.U_service_rate != null) {
            if (finalResults.u_dirty >= summaryData.U_service_rate) {
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



    // 5. Shell-Side Flow Distribution
const fractionData = finalResults.flow_fractions;
if (fractionData && Object.keys(fractionData).length > 0) {
    const flowBody = document.getElementById('flow-dist-table').createTBody();

    // --- CORRECTED: Standard Bell-Delaware Labels ---
    // This object now correctly maps the fraction key from Python to its standard name.
    const streamLabels = {
        'B_fraction': 'Main Cross-Flow (B)',
        'C_fraction': 'Bundle-to-Shell Bypass (C)', // Formerly mislabeled as (A)
        'A_fraction': 'Tube-to-Baffle Leakage (A)',   // Formerly mislabeled as (C)
        'E_fraction': 'Baffle-to-Shell Leakage (E)',
        'F_fraction': 'Pass-Partition Bypass (F)'
    };
    
    // Create an ordered list to display rows in the standard B, C, A, E, F order
    const displayOrder = ['B_fraction', 'C_fraction', 'A_fraction', 'E_fraction', 'F_fraction'];

    // Display each fraction's value in the correct order
    for (const key of displayOrder) {
        if (fractionData[key] != null) {
            // The createRow function should take (body, label, value, unit)
            createRow(flowBody, streamLabels[key], fractionData[key].toFixed(3), '');
        }
    }
    
    // --- REBUILT: Intelligent Status and Recommendation Logic ---
    let problems = [];
    const b_fraction = fractionData.B_fraction || 0;

    // Define correct advice and design thresholds for each stream
    const advice = {
        C_fraction: "Reduce bundle-to-shell bypass (consider adding sealing strips).",
        A_fraction: "Reduce tube-to-baffle clearance.",
        E_fraction: "Reduce baffle-to-shell clearance.",
        F_fraction: "Revise tube layout to minimize pass-partition lanes."
    };

    const thresholds = {
        C_fraction: 0.20, // A high C-stream is a critical flaw
        A_fraction: 0.20, // A high A-stream is a critical flaw
        E_fraction: 0.15, // E-stream should be less than 15%
        F_fraction: 0.15  // F-stream should be less than 15%
    };

    // CORRECTED LOGIC: Check each leakage/bypass stream against its individual threshold.
    // This ensures ALL existing problems are reported, not just the first one found.
    for (const key in thresholds) {
        if (fractionData[key] > thresholds[key]) {
            problems.push(advice[key]);
        }
    }

    // Add a fundamental check for the main cross-flow. If it's too low, the design is inherently poor.
    // This check is independent of the others.
    if (b_fraction < 0.35) {
        const generalAdvice = "Main cross-flow is critically low. Overall geometry is inefficient.";
        // Avoid adding a generic message if a specific, actionable cause is already found.
        if (problems.length === 0) {
            problems.push(generalAdvice);
        }
    }
    
    // --- Display the Final Status ---
    const statusRow = flowBody.insertRow();
    const statusLabelCell = statusRow.insertCell();
    statusLabelCell.style.fontWeight = 'bold';
    statusLabelCell.textContent = 'Flow Distribution Status';
    
    const statusValueCell = statusRow.insertCell();
    if (problems.length === 0) {
        statusValueCell.textContent = 'Good Flow Distribution';
        statusValueCell.className = 'status-ok';
    } else {
        // Build the HTML for the recommendations
        let recommendationsHTML = '<strong class="status-high">Poor Distribution - High Bypass/Leakage</strong><ul style="margin: 5px 0 0 20px; padding: 0; text-align: left;">';
        // Use a Set to ensure unique recommendations are displayed
        new Set(problems).forEach(p => {
            recommendationsHTML += `<li>${p}</li>`;
        });
        recommendationsHTML += '</ul>';
        
        statusValueCell.innerHTML = recommendationsHTML;
    }
}




    // 6. Design & Safety Checks
    // ...

    // 6. Design & Safety Checks
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
                        status = `OK (Limit: ${limit} kg/ms2)`;
                        statusClass = 'status-ok';
                    } else {
                        if (key === 'shell_inlet') { status = `High - Impingement Plate Required (Limit: ${limit} kg/ms2)`; } 
                        else { status = `High - Revise Nozzle/Flow Design (Limit: ${limit} kg/ms2)`; }
                        statusClass = 'status-high';
                    }
                }
                
                const valueRow = checksBody.insertRow();
                valueRow.insertCell().textContent = labels[key];
                valueRow.insertCell().textContent = (value != null) ? `${parseFloat(value).toFixed(2)} kg/ms2` : 'N/A';
                
                const statusRow = checksBody.insertRow();
                statusRow.insertCell().textContent = 'Status';
                const statusCell = statusRow.insertCell();
                statusCell.textContent = status;
                statusCell.className = statusClass;
            }
        }
    }
});













