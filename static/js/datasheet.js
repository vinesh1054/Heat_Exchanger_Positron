// // static/js/datasheet.js

// document.addEventListener('DOMContentLoaded', function() {
//     // --- Load all data from storage ---
//     const customerData = loadPageData('customer');
//     const thermalData = loadPageData('thermal');
//     const geoData = loadPageData('geometry');
//     const materialsData = loadPageData('materials');
//     const nozzleData = loadPageData('nozzles');
//     const finalResults = loadPageData('finalResults');

//     // --- Robust check for all required data objects ---
//     if (!customerData || !thermalData || !geoData || !materialsData || !nozzleData || !finalResults) {
//         document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #d00;">
//             <h3>Error: Incomplete Data</h3><p>Could not generate the TEMA datasheet. Please complete all prior calculation steps.</p>
//             <a href="/"><button style="padding: 10px 20px; cursor: pointer;">Start New Calculation</button></a></div>`;
//         return;
//     }

//     // --- HELPER FUNCTIONS ---
//     const format = (value, precision = 3) => {
//         if (value == null || value === '') return '---';
//         const numValue = parseFloat(value);
//         return isNaN(numValue) ? value : numValue.toFixed(precision);
//     };


//         // NEW version of createRow that accepts an optional class name
//     const createRow = (tbody, values = [], rowClass = '') => {
//         const row = tbody.insertRow();
//         if (rowClass) {
//             row.className = rowClass; // Add the class to the <tr> element
//         }
//         for (let i = 0; i < 5; i++) {
//             const cell = row.insertCell(i);
//             cell.innerHTML = values[i] || '';
//         }
//     };

    
//     const addSectionHeader = (tbody, title) => {
//         tbody.insertRow().innerHTML = `<td colspan="5" class="section-header">${title}</td>`;
//     };

//     // --- PRE-CALCULATIONS & DATA PREPARATION ---
//     // const shell_mass_flow = thermalData.shell_flowrate
//     const shell_mass_flow = thermalData.shell_flowrate;
//     const tube_mass_flow = thermalData.tube_flowrate;
//     const shell_dp_bar = finalResults.kern_dp_shell / 100;
//     const tube_dp_bar = finalResults.kern_dp_tube / 100;
//     const temaType = `${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type}`;

//     // --- DOM MANIPULATION ---

//     // 1. Populate Header
//     // document.getElementById('company-info').innerHTML = `<strong>Company:</strong> ${customerData.cust_company || '---'}`;
//     // document.getElementById('job-info').innerHTML = `
//     //     <strong>Size:</strong> ${format(geoData.shell_diameter,0)} x ${format(geoData.tube_length, 2)}m    <strong>Type:</strong> Shell & Tube Exchanger<br>
//     //     <strong>Item No:</strong> ${customerData.cust_item_no || '---'}
//     // `;
//     // document.getElementById('page-info').innerHTML = `<strong>Job No:</strong> ${customerData.cust_job_no || '---'}<br><strong>Rev:</strong> ${customerData.cust_rev_no || '0'}`;
//     // document.getElementById('surface-info').innerHTML = `<div class="header-info-box"><strong>Surface/Unit: ${format(finalResults.design_summary.A_actual, 2)} m²</strong></div>`;

//     // 2. Build Main Table
//     const tbody = document.createElement('tbody');
//     document.getElementById('datasheet-main-table').appendChild(tbody);

//     const tbody1 = document.createElement('tbody1');
//     document.getElementById('datasheet-main-table-1').appendChild(tbody1);

//     // --- SECTION 1 & 2 ---
//     // createRow(tbody, [
//     //     `1. Service: ${customerData.cust_service || '---'}`, `Connected in: ${geoData.shells_in_series || 1} parallel ${geoData.shells_in_parallel || 1} series`, '',
//     //     `2. Size: ${format(geoData.shell_diameter,0)} mm OD x ${format(geoData.tube_length, 2)} m`, `Surface/Shell: ${format(finalResults.design_summary.A_actual, 2)} m²`
//     // ]);
//     addSectionHeader(tbody, 'CUSTOMER DETAILS');
//     // document.getElementById('company-info').innerHTML = `<strong>Company:</strong> ${customerData.cust_company || '---'}`;
//     createRow(tbody, [`Company: ${customerData.cust_company}`] )
//     createRow(tbody, [`Location: ${customerData.cust_location}`] )
//         createRow(tbody, [
//         `Service of Unit: ${customerData.cust_service}`, `Item No.: ${customerData.cust_item_no}`,``,`Our Reference ${customerData.cust_item_no}`   ]);
//     createRow(tbody, [`Rev No.: ${customerData.cust_rev_no}`, `Job No.: ${customerData.cust_job_no}`,``, `Your Reference: ${customerData.cust_your_ref}`] )
    
//     addSectionHeader(tbody, 'BASIC DETAILS');
//     createRow(tbody,[` Size: ${format(geoData.shell_diameter,0)} mm OD x ${format(geoData.tube_length, 2)} m`, `Connected in: ${geoData.shells_in_series || 1} parallel ${geoData.shells_in_parallel || 1} series`,`Type: ${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type} ${geoData.orientation}`,`Surface/Shell: ${format(finalResults.design_summary.A_actual, 2)} m²`])

    

    


//     // --- SECTION 3: PERFORMANCE OF ONE UNIT ---
//     addSectionHeader(tbody, 'PERFORMANCE OF ONE UNIT');
//     createRow(tbody, ['', '<strong class="col-header">Shell Side</strong>', '', '<strong class="col-header">Tube Side</strong>', '']);
//     createRow(tbody, ['Fluid Name', thermalData.shell_fluid_name, '', thermalData.tube_fluid_name, '']);
//     createRow(tbody, [`Fluid Quantity, Total ${thermalData.flowrate_unit, 'm3/s'}`, format(shell_mass_flow, 4), '', format(tube_mass_flow, 4), '']);
//     createRow(tbody, ['Temperature, °C (In/Out)', `${format(thermalData.shell_inlet_temp, 2)}`, `${format(thermalData.shell_outlet_temp, 2)}`, `${format(thermalData.tube_inlet_temp, 2)}`, `${format(thermalData.tube_outlet_temp, 2)}`]);
//     createRow(tbody, ['Density, kg/m³ (In/Out)', `${format(thermalData.shell_inlet_density, 1)} `, `${format(thermalData.shell_outlet_density, 1)}`, `${format(thermalData.tube_inlet_density, 1)} `, `${format(thermalData.tube_outlet_density, 1)}`]);
//     createRow(tbody, ['Viscosity, cP (In/Out)', `${format(thermalData.shell_inlet_viscosity, 3)} `, `${format(thermalData.shell_outlet_viscosity, 3)}`, `${format(thermalData.tube_inlet_viscosity, 3)}`, `${format(thermalData.tube_outlet_viscosity, 3)}`]);
//     createRow(tbody, ['Specific Heat, kJ/kg.K', format(thermalData.shell_inlet_cp, 3), '', format(thermalData.tube_inlet_cp, 3), '']);
//     createRow(tbody, ['Thermal Cond., W/m.K', format(thermalData.shell_inlet_k, 3), '', format(thermalData.tube_inlet_k, 3), '']);
//     // createRow(tbody, ['Pressure Drop, bar (Calc)', `${format(shell_dp_bar, 4)}`, '', `${format(tube_dp_bar, 4)}`, '']);
//     createRow(tbody, ['Pressure Drop, bar (Calc)', `${format(finalResults.bd_dp_shell/100, 4)}`, '', `${format(tube_dp_bar, 4)}`, '']);
//     createRow(tbody, ['Fouling Factor, m²h°C/kcal', format(thermalData.shell_fouling, 5), '', format(thermalData.tube_fouling, 5), '']);
//     createRow(tbody, [`Heat Exchanged (kW)`, `${format(thermalData.heat_load, 2)}`    ]);
//     createRow(tbody, [`Transfer Rate (W/m2K)`, `Service: ${format(finalResults.design_summary.U_service_rate, 2)}`,`Dirty: ${format(finalResults.bd_u_dirty, 2)}`, `Clean: ${format(finalResults.bd_u_clean, 2)}`,
//          `Margin: <span class="${finalResults.design_summary.margin_bd >= 0 ? 'status-ok' : 'status-high'}">${format(finalResults.design_summary.margin_bd, 2)} %</span>`  ]);

//     // --- SECTION 4: CONSTRUCTION ---
//     addSectionHeader(tbody, 'CONSTRUCTION');
//     const sketchCell = `<img src="/static/images/tema_${temaType.toLowerCase()}.png" alt="${temaType} Sketch" class="tema-sketch" onerror="this.style.display='none'">`;
//     createRow(tbody, ['Design/Test Pressure, bar', format(thermalData.shell_design_pressure, 2), '', format(thermalData.tube_design_pressure, 2), sketchCell]);
//     createRow(tbody, ['Design Temperature, °C', format(thermalData.shell_design_temp, 0), '', format(thermalData.tube_design_temp, 0), '']);
//     createRow(tbody, ['No. Passes per Shell', '1', '', geoData.num_passes, '']);
//     createRow(tbody, ['Corrosion Allowance, mm', format(thermalData.shell_corr_allow, 2), '', format(thermalData.tube_corr_allow, 2), '']);
//     createRow(tbody, ['Connections', `<strong>Size:</strong> ${nozzleData.shell.inlet.nps} (${format(nozzleData.shell.inlet.id_mm, 1)} mm ID)`, '', `<strong>Size:</strong> ${nozzleData.tube.inlet.nps} (${format(nozzleData.tube.inlet.id_mm, 1)} mm ID)`, '']);
    
//     addSectionHeader(tbody, 'GEOMETRY');
//     // Detailed Construction Table
//    // --- START OF MODIFIED ROWS ---
//     // These rows will NOT have vertical grid lines
//     const tubeLengthMm = geoData.tube_length * 1000;

//     createRow(tbody, ['Tubes', `<strong>#:</strong> ${geoData.num_tubes}    <strong>OD:</strong> ${format(geoData.tube_od, 3)} mm`, `<strong>Thk(avg):</strong> ${format(geoData.tube_thickness, 3)} mm`, `<strong>Length:</strong> ${format(tubeLengthMm, 0)} mm`, `<strong>Pitch:</strong> ${format(geoData.tube_pitch, 2)} mm    ${geoData.tube_layout}°`], 'horizontal-only');
//     createRow(tbody, ['Shell', `<strong>ID:</strong> ${format(geoData.shell_diameter, 1)} mm`, `<strong>OD:</strong>${(format(geoData.shell_thickness, 1))} mm`]);
//     // createRow(tbody, ['Shell Cover', materialsData.mat_shell_bonnet, '', 'Channel Cover', materialsData.mat_tube_channel], 'horizontal-only');
//     createRow(tbody, ['Baffles', `<strong>Type:</strong> Single Seg.`, `<strong>Cut:</strong> ${format(geoData.baffle_cut, 1)} %`, `<strong>Spacing:</strong> ${format(geoData.baffle_spacing, 1)} mm`, ''], 'horizontal-only');
//     // createRow(tbody, ['Tube to Tubesheet Joint', 'Expanded', '', 'Tubesheet Matl', materialsData.mat_tubesheet], 'horizontal-only');
//     createRow(tbody, ['ρv² Inlet Nozzle', `${format(finalResults.design_checks.momentum.shell_inlet.value, 2)} kg/(m·s²)`, '', 'Bundle Exit', '---'], 'horizontal-only');
//     // createRow(tbody, ['Gaskets', `<strong>Shell:</strong> ${materialsData.mat_shell_gasket}`, '', `<strong>Tube:</strong> ${materialsData.mat_tube_gasket}`, ''], 'horizontal-only');
//     // createRow(tbody, ['Code Requirements', 'ASME Sect. VIII Div. 1', `<strong>Orientation:</strong> ${geoData.orientation}`, 'Weight/Shell (E/F)', `--- / --- kg`], 'horizontal-only');
//     // createRow(tbody, ['Remarks', 'Calculations performed by Heat Exchanger Performance Tool.', '', '', ''], 'horizontal-only');
//     // createRow(tbody, ['Remarks', '', '', '', ''], 'horizontal-only');
    

//     addSectionHeader(tbody, 'MATERIAL');

//     // createRow(tbody, ['Tubes', `<strong>#:</strong> ${geoData.num_tubes}    <strong>OD:</strong> ${format(geoData.tube_od, 3)} mm`, `<strong>Thk(avg):</strong> ${format(geoData.tube_thickness, 3)} mm`, `<strong>Length:</strong> ${format(tubeLengthMm, 0)} mm`, `<strong>Pitch:</strong> ${format(geoData.tube_pitch, 2)} mm    ${geoData.tube_layout}°`], 'horizontal-only');
//     createRow(tbody, ['Shell', `<strong>Mat'l:</strong> ${materialsData.mat_shell_cylinder}`, `<strong>ID:</strong> ${format(geoData.shell_diameter, 1)} mm`, 'Channel', materialsData.mat_tube_channel], 'horizontal-only');
//     createRow(tbody, ['Shell Cover', materialsData.mat_shell_bonnet, '', 'Channel Cover', materialsData.mat_tube_channel], 'horizontal-only');
//     // createRow(tbody, ['Baffles', `<strong>Type:</strong> Single Seg.`, `<strong>Cut:</strong> ${format(geoData.baffle_cut, 1)} %`, `<strong>Spacing:</strong> ${format(geoData.baffle_spacing, 1)} mm`, ''], 'horizontal-only');
//     createRow(tbody, ['Tube to Tubesheet Joint', 'Expanded', '', 'Tubesheet Matl', materialsData.mat_tubesheet], 'horizontal-only');
//     // createRow(tbody, ['ρv² Inlet Nozzle', `${format(finalResults.design_checks.momentum.shell_inlet.value, 2)} kg/(m·s²)`, '', 'Bundle Exit', '---'], 'horizontal-only');
//     createRow(tbody, ['Gaskets', `<strong>Shell:</strong> ${materialsData.mat_shell_gasket}`, '', `<strong>Tube:</strong> ${materialsData.mat_tube_gasket}`, ''], 'horizontal-only');
//     createRow(tbody, ['Code Requirements', 'ASME Sect. VIII Div. 1', `<strong>Orientation:</strong> ${geoData.orientation}`, 'Weight/Shell (E/F)', `--- / --- kg`], 'horizontal-only');
//     // createRow(tbody, ['Remarks', 'Calculations performed by Heat Exchanger Performance Tool.', '', '', ''], 'horizontal-only');
//     createRow(tbody, ['Remarks', '', '', '', ''], 'horizontal-only');


//     // 3. Populate Footer
//     document.getElementById('footer-info').innerHTML = `<strong>`;
// });

// static/js/datasheet.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Load all data from storage ---
    const customerData = loadPageData('customer');
    const thermalData = loadPageData('thermal');
    const geoData = loadPageData('geometry');
    const materialsData = loadPageData('materials');
    const nozzleData = loadPageData('nozzles');
    const finalResults = loadPageData('finalResults');

    // --- Robust check for all required data objects ---
    if (!customerData || !thermalData || !geoData || !materialsData || !nozzleData || !finalResults) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #d00;">
            <h3>Error: Incomplete Data</h3><p>Could not generate the TEMA datasheet. Please complete all prior calculation steps.</p>
            <a href="/"><button style="padding: 10px 20px; cursor: pointer;">Start New Calculation</button></a></div>`;
        return;
    }

    // --- HELPER FUNCTIONS ---
    const format = (value, precision = 3) => {
        if (value == null || value === '') return '---';
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : numValue.toFixed(precision);
    };


        // NEW version of createRow that accepts an optional class name
    const createRow = (tbody, values = [], rowClass = '') => {
        const row = tbody.insertRow();
        if (rowClass) {
            row.className = rowClass; // Add the class to the <tr> element
        }
        for (let i = 0; i < 5; i++) {
            const cell = row.insertCell(i);
            cell.innerHTML = values[i] || '';
        }
    };

    
    const addSectionHeader = (tbody, title) => {
        tbody.insertRow().innerHTML = `<td colspan="5" class="section-header">${title}</td>`;
    };

    // --- PRE-CALCULATIONS & DATA PREPARATION ---
    // Get the display unit and the SI flow rates (which are in m3/s)
    const displayUnit = thermalData.flowrate_unit || 'm3/s';
    const shell_flow_si = parseFloat(thermalData.shell_flowrate);
    const tube_flow_si = parseFloat(thermalData.tube_flowrate);

    let shell_flow_display = shell_flow_si;
    let tube_flow_display = tube_flow_si;

    // Convert SI flow rate (m3/s) back to the user's selected display unit
    if (displayUnit === 'm3/h') {
        shell_flow_display *= 3600;
        tube_flow_display *= 3600;
    } else if (displayUnit === 'kg/s') {
        const shell_density = parseFloat(thermalData.shell_inlet_density);
        const tube_density = parseFloat(thermalData.tube_inlet_density);
        if (!isNaN(shell_density)) shell_flow_display *= shell_density;
        if (!isNaN(tube_density)) tube_flow_display *= tube_density;
    } else if (displayUnit === 'kg/h') {
        const shell_density = parseFloat(thermalData.shell_inlet_density);
        const tube_density = parseFloat(thermalData.tube_inlet_density);
        if (!isNaN(shell_density)) shell_flow_display = shell_flow_display * shell_density * 3600;
        if (!isNaN(tube_density)) tube_flow_display = tube_flow_display * tube_density * 3600;
    }
    // Note: The default case for 'm3/s' requires no conversion.

    const shell_dp_bar = finalResults.kern_dp_shell / 100;
    const tube_dp_bar = finalResults.kern_dp_tube / 100;
    const temaType = `${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type}`;

    // --- DOM MANIPULATION ---

    // 1. Populate Header
    // document.getElementById('company-info').innerHTML = `<strong>Company:</strong> ${customerData.cust_company || '---'}`;
    // document.getElementById('job-info').innerHTML = `
    //     <strong>Size:</strong> ${format(geoData.shell_diameter,0)} x ${format(geoData.tube_length, 2)}m    <strong>Type:</strong> Shell & Tube Exchanger<br>
    //     <strong>Item No:</strong> ${customerData.cust_item_no || '---'}
    // `;
    // document.getElementById('page-info').innerHTML = `<strong>Job No:</strong> ${customerData.cust_job_no || '---'}<br><strong>Rev:</strong> ${customerData.cust_rev_no || '0'}`;
    // document.getElementById('surface-info').innerHTML = `<div class="header-info-box"><strong>Surface/Unit: ${format(finalResults.design_summary.A_actual, 2)} m²</strong></div>`;

    // 2. Build Main Table
    const tbody = document.createElement('tbody');
    document.getElementById('datasheet-main-table').appendChild(tbody);

    const tbody1 = document.createElement('tbody1');
    document.getElementById('datasheet-main-table-1').appendChild(tbody1);

    // --- SECTION 1 & 2 ---
    // createRow(tbody, [
    //     `1. Service: ${customerData.cust_service || '---'}`, `Connected in: ${geoData.shells_in_series || 1} parallel ${geoData.shells_in_parallel || 1} series`, '',
    //     `2. Size: ${format(geoData.shell_diameter,0)} mm OD x ${format(geoData.tube_length, 2)} m`, `Surface/Shell: ${format(finalResults.design_summary.A_actual, 2)} m²`
    // ]);
    addSectionHeader(tbody, 'CUSTOMER DETAILS');
    // document.getElementById('company-info').innerHTML = `<strong>Company:</strong> ${customerData.cust_company || '---'}`;
    createRow(tbody, [`Company: ${customerData.cust_company}`] )
    createRow(tbody, [`Location: ${customerData.cust_location}`] )
        createRow(tbody, [
        `Service of Unit: ${customerData.cust_service}`, `Item No.: ${customerData.cust_item_no}`,``,`Our Reference ${customerData.cust_item_no}`   ]);
    createRow(tbody, [`Rev No.: ${customerData.cust_rev_no}`, `Job No.: ${customerData.cust_job_no}`,``, `Your Reference: ${customerData.cust_your_ref}`] )
    
    addSectionHeader(tbody, 'BASIC DETAILS');
    createRow(tbody,[` Size: ${format(geoData.shell_diameter,0)} mm OD x ${format(geoData.tube_length, 2)} m`, `Connected in: ${geoData.shells_in_series || 1} parallel ${geoData.shells_in_parallel || 1} series`,`Type: ${geoData.front_head_type}${geoData.shell_type}${geoData.rear_head_type} ${geoData.orientation}`,`Surface/Shell: ${format(finalResults.design_summary.A_actual, 2)} m²`])

    
    // --- SECTION 3: PERFORMANCE OF ONE UNIT ---
    addSectionHeader(tbody, 'PERFORMANCE OF ONE UNIT');
    createRow(tbody, ['', '<strong class="col-header">Shell Side</strong>', '', '<strong class="col-header">Tube Side</strong>', '']);
    createRow(tbody, ['Fluid Name', thermalData.shell_fluid_name, '', thermalData.tube_fluid_name, '']);
    createRow(tbody, [`Fluid Quantity, Total (${displayUnit})`, format(shell_flow_display, 4), '', format(tube_flow_display, 4), '']);
    createRow(tbody, ['Temperature, °C (In/Out)', `${format(thermalData.shell_inlet_temp, 2)}`, `${format(thermalData.shell_outlet_temp, 2)}`, `${format(thermalData.tube_inlet_temp, 2)}`, `${format(thermalData.tube_outlet_temp, 2)}`]);
    createRow(tbody, ['Density, kg/m³ (In/Out)', `${format(thermalData.shell_inlet_density, 1)} `, `${format(thermalData.shell_outlet_density, 1)}`, `${format(thermalData.tube_inlet_density, 1)} `, `${format(thermalData.tube_outlet_density, 1)}`]);
    createRow(tbody, ['Viscosity, cP (In/Out)', `${format(thermalData.shell_inlet_viscosity, 3)} `, `${format(thermalData.shell_outlet_viscosity, 3)}`, `${format(thermalData.tube_inlet_viscosity, 3)}`, `${format(thermalData.tube_outlet_viscosity, 3)}`]);
    createRow(tbody, ['Specific Heat, kJ/kg.K', format(thermalData.shell_inlet_cp, 3), '', format(thermalData.tube_inlet_cp, 3), '']);
    createRow(tbody, ['Thermal Cond., W/m.K', format(thermalData.shell_inlet_k, 3), '', format(thermalData.tube_inlet_k, 3), '']);
    // createRow(tbody, ['Pressure Drop, bar (Calc)', `${format(shell_dp_bar, 4)}`, '', `${format(tube_dp_bar, 4)}`, '']);
    createRow(tbody, ['Pressure Drop, bar (Calc)', `${format(finalResults.bd_dp_shell/100, 4)}`, '', `${format(tube_dp_bar, 4)}`, '']);
    createRow(tbody, ['Fouling Factor, m²h°C/kcal', format(thermalData.shell_fouling, 5), '', format(thermalData.tube_fouling, 5), '']);
    createRow(tbody, [`Heat Exchanged (kW)`, `${format(thermalData.heat_load, 2)}`    ]);
    createRow(tbody, [`Transfer Rate (W/m2K)`, `Service: ${format(finalResults.design_summary.U_service_rate, 2)}`,`Dirty: ${format(finalResults.bd_u_dirty, 2)}`, `Clean: ${format(finalResults.bd_u_clean, 2)}`,
         `Margin: <span class="${finalResults.design_summary.margin_bd >= 0 ? 'status-ok' : 'status-high'}">${format(finalResults.design_summary.margin_bd, 2)} %</span>`  ]);

    // --- SECTION 4: CONSTRUCTION ---
    addSectionHeader(tbody, 'CONSTRUCTION');
    const sketchCell = `<img src="/static/images/tema_${temaType.toLowerCase()}.png" alt="${temaType} Sketch" class="tema-sketch" onerror="this.style.display='none'">`;
    createRow(tbody, ['Design/Test Pressure, bar', format(thermalData.shell_design_pressure, 2), '', format(thermalData.tube_design_pressure, 2), sketchCell]);
    createRow(tbody, ['Design Temperature, °C', format(thermalData.shell_design_temp, 0), '', format(thermalData.tube_design_temp, 0), '']);
    createRow(tbody, ['No. Passes per Shell', '1', '', geoData.num_passes, '']);
    createRow(tbody, ['Corrosion Allowance, mm', format(thermalData.shell_corr_allow, 2), '', format(thermalData.tube_corr_allow, 2), '']);
    createRow(tbody, ['Connections', `<strong>Size:</strong> ${nozzleData.shell.inlet.nps} (${format(nozzleData.shell.inlet.id_mm, 1)} mm ID)`, '', `<strong>Size:</strong> ${nozzleData.tube.inlet.nps} (${format(nozzleData.tube.inlet.id_mm, 1)} mm ID)`, '']);
    
    addSectionHeader(tbody, 'GEOMETRY');
    // Detailed Construction Table
   // --- START OF MODIFIED ROWS ---
    // These rows will NOT have vertical grid lines
    const tubeLengthMm = geoData.tube_length * 1000;

    createRow(tbody, ['Tubes', `<strong>#:</strong> ${geoData.num_tubes}    <strong>OD:</strong> ${format(geoData.tube_od, 3)} mm`, `<strong>Thickness(avg):</strong> ${format(geoData.tube_thickness, 3)} mm`, `<strong>Length:</strong> ${format(tubeLengthMm, 0)} mm`, `<strong>Pitch:</strong> ${format(geoData.tube_pitch, 2)} mm    ${geoData.tube_layout}°`], 'horizontal-only');
    createRow(tbody, ['Shell', `<strong>ID:</strong> ${format(geoData.shell_diameter, 1)} mm`, `<strong>Thickness:</strong>${(format(geoData.shell_thickness, 1))} mm`]);
    // createRow(tbody, ['Shell Cover', materialsData.mat_shell_bonnet, '', 'Channel Cover', materialsData.mat_tube_channel], 'horizontal-only');
    createRow(tbody, ['Baffles', `<strong>Type:</strong> Single Seg.`, `<strong>Cut:</strong> ${format(geoData.baffle_cut, 1)} %`, `<strong>Spacing:</strong> ${format(geoData.baffle_spacing, 1)} mm`, ''], 'horizontal-only');
    // createRow(tbody, ['Tube to Tubesheet Joint', 'Expanded', '', 'Tubesheet Matl', materialsData.mat_tubesheet], 'horizontal-only');
    createRow(tbody, ['ρv² Inlet Nozzle', `${format(finalResults.design_checks.momentum.shell_inlet.value, 2)} kg/(m·s²)`, '', 'Bundle Exit', '---'], 'horizontal-only');
    // createRow(tbody, ['Gaskets', `<strong>Shell:</strong> ${materialsData.mat_shell_gasket}`, '', `<strong>Tube:</strong> ${materialsData.mat_tube_gasket}`, ''], 'horizontal-only');
    // createRow(tbody, ['Code Requirements', 'ASME Sect. VIII Div. 1', `<strong>Orientation:</strong> ${geoData.orientation}`, 'Weight/Shell (E/F)', `--- / --- kg`], 'horizontal-only');
    // createRow(tbody, ['Remarks', 'Calculations performed by Heat Exchanger Performance Tool.', '', '', ''], 'horizontal-only');
    // createRow(tbody, ['Remarks', '', '', '', ''], 'horizontal-only');
    

    addSectionHeader(tbody, 'MATERIAL');

    // createRow(tbody, ['Tubes', `<strong>#:</strong> ${geoData.num_tubes}    <strong>OD:</strong> ${format(geoData.tube_od, 3)} mm`, `<strong>Thk(avg):</strong> ${format(geoData.tube_thickness, 3)} mm`, `<strong>Length:</strong> ${format(tubeLengthMm, 0)} mm`, `<strong>Pitch:</strong> ${format(geoData.tube_pitch, 2)} mm    ${geoData.tube_layout}°`], 'horizontal-only');
    createRow(tbody, ['Shell', `<strong>Mat'l:</strong> ${materialsData.mat_shell_cylinder}`, '', 'Channel', materialsData.mat_tube_channel], 'horizontal-only');
    createRow(tbody, ['Shell Cover', materialsData.mat_shell_bonnet, '', 'Channel Cover', materialsData.mat_tube_channel], 'horizontal-only');
    // createRow(tbody, ['Baffles', `<strong>Type:</strong> Single Seg.`, `<strong>Cut:</strong> ${format(geoData.baffle_cut, 1)} %`, `<strong>Spacing:</strong> ${format(geoData.baffle_spacing, 1)} mm`, ''], 'horizontal-only');
    createRow(tbody, ['Tube to Tubesheet Joint', 'Expanded', '', 'Tubesheet Matl', materialsData.mat_tubesheet], 'horizontal-only');
    // createRow(tbody, ['ρv² Inlet Nozzle', `${format(finalResults.design_checks.momentum.shell_inlet.value, 2)} kg/(m·s²)`, '', 'Bundle Exit', '---'], 'horizontal-only');
    createRow(tbody, ['Gaskets', `<strong>Shell:</strong> ${materialsData.mat_shell_gasket}`, '', `<strong>Tube:</strong> ${materialsData.mat_tube_gasket}`, ''], 'horizontal-only');
    createRow(tbody, ['Code Requirements', `${thermalData.asme_code1}`, `TEMA Class: ${thermalData.tema_class}`, `<strong>Orientation:</strong> ${geoData.orientation}`], 'horizontal-only');
    // createRow(tbody, ['Code Requirements', 'ASME Sec. VIII Div. 1', `<strong>Orientation:</strong> ${geoData.orientation}`, 'Weight/Shell (E/F)', `--- / --- kg`], 'horizontal-only');
    // createRow(tbody, ['Remarks', 'Calculations performed by Heat Exchanger Performance Tool.', '', '', ''], 'horizontal-only');
    createRow(tbody, ['Remarks', '', '', '', ''], 'horizontal-only');


    // 3. Populate Footer
    document.getElementById('footer-info').innerHTML = `<strong>`;
});