// document.addEventListener('DOMContentLoaded', function() {
//     // --- ELEMENT SELECTORS ---
//     // The button ID is updated to reflect its new action.
//     const calculateAndProceedBtn = document.getElementById('calculate-and-proceed-btn');
//     const errorDiv = document.getElementById('error-message');
    
//     const geometryInputs = {
//         front_head_type: document.getElementById('front_head_type'),
//         shell_type: document.getElementById('shell_type'),
//         rear_head_type: document.getElementById('rear_head_type'),
//         shells_in_series: document.getElementById('shells_in_series'),
//         shells_in_parallel: document.getElementById('shells_in_parallel'),
//         shell_diameter: document.getElementById('shell_diameter'),
//         shell_thickness: document.getElementById('shell_thickness'),
//         orientation: document.getElementById('orientation'),
//         tube_od: document.getElementById('tube_od'),
//         tube_thickness: document.getElementById('tube_thickness'),
//         tube_length: document.getElementById('tube_length'),
//         tube_pitch: document.getElementById('tube_pitch'),
//         tube_layout: document.getElementById('tube_layout'),
//         num_tubes: document.getElementById('num_tubes'),
//         num_passes: document.getElementById('num_passes'),
//         pass_layout: document.getElementById('pass_layout'),
//         pass_lane_width: document.getElementById('pass_lane_width'),
//         baffle_type: document.getElementById('baffle_type'),
//         baffle_spacing: document.getElementById('baffle_spacing'),
//         baffle_cut: document.getElementById('baffle_cut'),
//         shell_baffle_clearance: document.getElementById('shell_baffle_clearance'),
//         tube_baffle_clearance: document.getElementById('tube_baffle_clearance'),
//         num_sealing_strips: document.getElementById('num_sealing_strips'),
//         outer_tube_limit: document.getElementById('tube_otl'),
//     };

//     const passesAlert = document.getElementById('passes-validation-alert');

//         if (geometryInputs.rear_head_type == 'M' && num_passes%2 != 0 ){
//         showError('Even number of tube passes for U-Bent')
//     }

//     // --- HELPER FUNCTIONS ---

//     function validateTubePasses() {
//         const rearHeadType = geometryInputs.rear_head_type.value;
//         const numPassesInput = geometryInputs.num_passes;
//         let currentPasses = parseInt(numPassesInput.value, 10);

//         // Clear any previous messages
//         passesAlert.textContent = '';
//         passesAlert.style.display = 'none';

//         // Check if the validation rule applies
//         if (rearHeadType === 'U' && !isNaN(currentPasses)) {
//             // Check if the number of passes is odd
//             if (currentPasses % 2 !== 0) {
//                 // Correct the value to the next even number
//                 const correctedPasses = currentPasses + 1;
//                 numPassesInput.value = correctedPasses;
                
//                 // Show a helpful message to the user
//                 passesAlert.textContent = `U-tube bundles require an even number of passes. Value corrected to ${correctedPasses}.`;
//                 passesAlert.style.display = 'block';

//                 // Optional: Hide the message after a few seconds
//                 setTimeout(() => {
//                     passesAlert.style.display = 'none';
//                 }, 4000);
//             }
//         }
//     }

//     // This function controls the visibility of the lane width input.
//     function toggleLaneWidthInput() {
//         const numPasses = parseInt(geometryInputs.num_passes.value, 10) || 1;
//         const passLayout = geometryInputs.pass_layout.value;
//         const container = document.getElementById('lane-width-container');

//         // Show the input if passes > 1 AND the layout is not 'none' or 'ribbon'.
//         if (numPasses > 1 && passLayout !== 'none' && passLayout !== 'ribbon') {
//             container.style.display = 'block';
//         } else {
//             container.style.display = 'none';
//         }
//     }

//     // Gathers all values from the form into an object.
//     function collectGeometryData() {
//         const data = {};
//         for (const key in geometryInputs) { 
//             if (geometryInputs[key]) {
//                 data[key] = geometryInputs[key].value;
//             }
//         }
//                     // --- NEW: VALIDATE OTL INPUT ---
//         // Check if the outer_tube_limit (OTL) input is empty.
//         if (!geometryData.outer_tube_limit || geometryData.outer_tube_limit.trim() === '') {
//             showError('Please provide a value for the Outer Tube Limit (OTL).');
//             // Re-enable the button and stop execution.
//             calculateAndProceedBtn.disabled = false;
//             calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
//             // Focus the problematic input field for better UX
//             if (geometryInputs.outer_tube_limit) {
//                 geometryInputs.outer_tube_limit.focus();
//             }
//             return; 
//         }

//         return data;
//     }

//             // --- NEW: VALIDATE OTL INPUT ---
//         // Check if the outer_tube_limit (OTL) input is empty.
//         if (!geometryData.outer_tube_limit || geometryData.outer_tube_limit.trim() === '') {
//             showError('Please provide a value for the Outer Tube Limit (OTL).');
//             // Re-enable the button and stop execution.
//             calculateAndProceedBtn.disabled = false;
//             calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
//             // Focus the problematic input field for better UX
//             if (geometryInputs.outer_tube_limit) {
//                 geometryInputs.outer_tube_limit.focus();
//             }
//             return; 
//         }

//     // Saves the collected geometry data to session storage.
//     function saveGeometryData() {
//         // Assuming you have a global saveData function from storage.js
//         saveData('geometry', collectGeometryData());
//     }



//     // Populates the form fields from session storage when the page loads.
//     function populateFormOnLoad() {
//         // Assuming you have a global loadPageData function from storage.js
//         const storedData = loadPageData('geometry');
//         if (storedData) {
//             for (const key in storedData) {
//                 if (geometryInputs[key]) {
//                     geometryInputs[key].value = storedData[key];
//                 }
//             }
//         }
//         // Update the TEMA select box backgrounds to match the loaded data.
//         // Assumes updateTemaSelectsUI is in a separate file (e.g., ui-helpers.js)
//         if (typeof updateTemaSelectsUI === 'function') {
//             updateTemaSelectsUI();
//         }
//         toggleLaneWidthInput();
//     }
    
//     // Displays an error message to the user.
//     function showError(message) {
//         errorDiv.textContent = message;
//         errorDiv.style.display = message ? 'block' : 'none';
//         if (message) {
//              // Scroll to the error message so the user sees it.
//              errorDiv.scrollIntoView({ behavior: 'smooth' });
//         }
//     }

//     // --- MAIN FUNCTION TO HANDLE THE WORKFLOW ---
//     async function handleSaveAndProceed() {
//         // 1. Provide immediate user feedback by disabling the button.
//         calculateAndProceedBtn.disabled = true;
//         calculateAndProceedBtn.textContent = 'Calculating...';

//         // 2. Load prerequisite data from the previous step.
//         const thermalData = loadPageData('thermal');
//         if (!thermalData) {
//             showError('Thermal data not found. Please complete the Thermal Analysis step first.');
//             calculateAndProceedBtn.disabled = false;
//             calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
//             return;
//         }

//         // 3. Collect and save the current page's data.
//         const geometryData = collectGeometryData();
//         saveGeometryData();
        
//         const payload = { thermal: thermalData, geometry: geometryData };

//         try {
//             // 4. Clear old errors and make the API call.
//             showError('');
//             const response = await fetch('/api/calculate-performance', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });

//             const results = await response.json();

//             if (!response.ok) {
//                 // If the server returns an error, display it.
//                 throw new Error(results.error || 'Calculation failed. Please check your inputs.');
//             }

//             // --- THIS IS THE KEY LOGIC CHANGE ---
//             // 5. Instead of displaying results, save them to session storage for later use.
//             saveData('performanceResults', results); 
//             console.log("Performance results calculated and saved to storage.", results);

//             // 6. Automatically redirect to the next page in the workflow.
//             window.location.href = '/materials';

//         } catch (error) {
//             // 7. If anything goes wrong, show the error and re-enable the button.
//             showError(error.message);
//             calculateAndProceedBtn.disabled = false;
//             calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
//         }
//     }

//     // --- EVENT LISTENERS ---
    
//     // Attach the main function to our new button.
//     if (calculateAndProceedBtn) {
//         calculateAndProceedBtn.addEventListener('click', handleSaveAndProceed);
//     }

//         if (geometryInputs.num_passes) {
//         geometryInputs.num_passes.addEventListener('change', toggleLaneWidthInput);
//         // --- NEW: Add the validation listener ---
//         geometryInputs.num_passes.addEventListener('change', validateTubePasses);
//     }
    
//     // Add listeners to toggle the visibility of the pass lane width input.
//     if (geometryInputs.num_passes) {
//         geometryInputs.num_passes.addEventListener('change', toggleLaneWidthInput);
//     }
//     if (geometryInputs.pass_layout) {
//         geometryInputs.pass_layout.addEventListener('change', toggleLaneWidthInput);
//     }

//         // --- NEW: Add the validation listener for the rear head type ---
//     if (geometryInputs.rear_head_type) {
//         geometryInputs.rear_head_type.addEventListener('change', validateTubePasses);
//     }
    
//     // --- INITIALIZATION FUNCTION ---
//     // This function will be called every time the page is displayed.
//     function initializePage() {
//         // This is the key fix: always reset the button's state on page load.
//         // This ensures that if the user navigates back to this page, the button
//         // is re-enabled and ready for another calculation.
//         if (calculateAndProceedBtn) {
//             calculateAndProceedBtn.disabled = false;
//             calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
//         }

//         // Populate the form with any saved data.
//         populateFormOnLoad();

//         // Run initial validation to ensure UI is consistent.
//         validateTubePasses(); 
//     }

//     // --- PAGE LOAD HANDLER ---
//     // Use the 'pageshow' event to handle initialization. It fires on initial load
//     // AND when the page is restored from the browser's back-forward cache.
//     // This reliably fixes the "stuck button" issue.
//     window.addEventListener('pageshow', function(event) {
//         initializePage();
//     });
// });



document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENT SELECTORS ---
    // The button ID is updated to reflect its new action.
    const calculateAndProceedBtn = document.getElementById('calculate-and-proceed-btn');
    const errorDiv = document.getElementById('error-message');
    
    const geometryInputs = {
        front_head_type: document.getElementById('front_head_type'),
        shell_type: document.getElementById('shell_type'),
        rear_head_type: document.getElementById('rear_head_type'),
        shells_in_series: document.getElementById('shells_in_series'),
        shells_in_parallel: document.getElementById('shells_in_parallel'),
        shell_diameter: document.getElementById('shell_diameter'),
        shell_thickness: document.getElementById('shell_thickness'),
        orientation: document.getElementById('orientation'),
        tube_od: document.getElementById('tube_od'),
        tube_thickness: document.getElementById('tube_thickness'),
        tube_length: document.getElementById('tube_length'),
        tube_pitch: document.getElementById('tube_pitch'),
        tube_layout: document.getElementById('tube_layout'),
        num_tubes: document.getElementById('num_tubes'),
        num_passes: document.getElementById('num_passes'),
        pass_layout: document.getElementById('pass_layout'),
        pass_lane_width: document.getElementById('pass_lane_width'),
        baffle_type: document.getElementById('baffle_type'),
        baffle_spacing: document.getElementById('baffle_spacing'),
        baffle_cut: document.getElementById('baffle_cut'),
        shell_baffle_clearance: document.getElementById('shell_baffle_clearance'),
        tube_baffle_clearance: document.getElementById('tube_baffle_clearance'),
        num_sealing_strips: document.getElementById('num_sealing_strips'),
        outer_tube_limit: document.getElementById('tube_otl'),
    };

    const passesAlert = document.getElementById('passes-validation-alert');
    
    // --- REMOVED incorrect top-level validation. This is properly handled by validateTubePasses() on change events.

    // --- HELPER FUNCTIONS ---

    function validateTubePasses() {
        const rearHeadType = geometryInputs.rear_head_type.value;
        const numPassesInput = geometryInputs.num_passes;
        let currentPasses = parseInt(numPassesInput.value, 10);

        // Clear any previous messages
        passesAlert.textContent = '';
        passesAlert.style.display = 'none';

        // Check if the validation rule applies
        if (rearHeadType === 'U' && !isNaN(currentPasses)) {
            // Check if the number of passes is odd
            if (currentPasses % 2 !== 0) {
                // Correct the value to the next even number
                const correctedPasses = currentPasses + 1;
                numPassesInput.value = correctedPasses;
                
                // Show a helpful message to the user
                passesAlert.textContent = `U-tube bundles require an even number of passes. Value corrected to ${correctedPasses}.`;
                passesAlert.style.display = 'block';

                // Optional: Hide the message after a few seconds
                setTimeout(() => {
                    passesAlert.style.display = 'none';
                }, 4000);
            }
        }
    }

    // This function controls the visibility of the lane width input.
    function toggleLaneWidthInput() {
        const numPasses = parseInt(geometryInputs.num_passes.value, 10) || 1;
        const passLayout = geometryInputs.pass_layout.value;
        const container = document.getElementById('lane-width-container');

        // Show the input if passes > 1 AND the layout is not 'none' or 'ribbon'.
        if (numPasses > 1 && passLayout !== 'none' && passLayout !== 'ribbon') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // Gathers all values from the form into an object.
    function collectGeometryData() {
        const data = {};
        for (const key in geometryInputs) { 
            if (geometryInputs[key]) {
                data[key] = geometryInputs[key].value;
            }
        }
        return data;
    }

    // Saves the collected geometry data to session storage.
    function saveGeometryData() {
        // Assuming you have a global saveData function from storage.js
        saveData('geometry', collectGeometryData());
    }

    // Populates the form fields from session storage when the page loads.
    function populateFormOnLoad() {
        // Assuming you have a global loadPageData function from storage.js
        const storedData = loadPageData('geometry');
        if (storedData) {
            for (const key in storedData) {
                if (geometryInputs[key]) {
                    geometryInputs[key].value = storedData[key];
                }
            }
        }
        // Update the TEMA select box backgrounds to match the loaded data.
        // Assumes updateTemaSelectsUI is in a separate file (e.g., ui-helpers.js)
        if (typeof updateTemaSelectsUI === 'function') {
            updateTemaSelectsUI();
        }
        toggleLaneWidthInput();
    }
    
    // Displays an error message to the user.
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        if (message) {
             // Scroll to the error message so the user sees it.
             errorDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- MAIN FUNCTION TO HANDLE THE WORKFLOW ---
    async function handleSaveAndProceed() {
        // 1. Provide immediate user feedback by disabling the button.
        calculateAndProceedBtn.disabled = true;
        calculateAndProceedBtn.textContent = 'Calculating...';
        showError(''); // Clear previous errors

        // 2. Load prerequisite data from the previous step.
        const thermalData = loadPageData('thermal');
        if (!thermalData) {
            showError('Thermal data not found. Please complete the Thermal Analysis step first.');
            calculateAndProceedBtn.disabled = false;
            calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
            return;
        }

        // 3. Collect and validate the current page's data.
        const geometryData = collectGeometryData();
        
        // --- NEW: VALIDATE OTL INPUT ---
        // Check if the outer_tube_limit (OTL) input is empty.
        if (!geometryData.outer_tube_limit || geometryData.outer_tube_limit.trim() === '') {
            showError('Please provide a value for the Outer Tube Limit (OTL).');
            // Re-enable the button and stop execution.
            calculateAndProceedBtn.disabled = false;
            calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
            // Focus the problematic input field for better UX
            if (geometryInputs.outer_tube_limit) {
                geometryInputs.outer_tube_limit.focus();
            }
            return; 
        }

        // If validation passes, save the data.
        saveGeometryData();
        
        const payload = { thermal: thermalData, geometry: geometryData };

        try {
            // 4. Make the API call.
            const response = await fetch('/api/calculate-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const results = await response.json();

            if (!response.ok) {
                // If the server returns an error, display it.
                throw new Error(results.error || 'Calculation failed. Please check your inputs.');
            }

            // 5. Save results to session storage for the next page.
            saveData('performanceResults', results); 
            console.log("Performance results calculated and saved to storage.", results);

            // 6. Automatically redirect to the next page.
            window.location.href = '/materials';

        } catch (error) {
            // 7. If anything goes wrong, show the error and re-enable the button.
            showError(error.message);
            calculateAndProceedBtn.disabled = false;
            calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
        }
    }

    // --- EVENT LISTENERS ---
    
    // Attach the main function to our button.
    if (calculateAndProceedBtn) {
        calculateAndProceedBtn.addEventListener('click', handleSaveAndProceed);
    }

    // Add listeners to toggle lane width and validate passes.
    if (geometryInputs.num_passes) {
        geometryInputs.num_passes.addEventListener('change', toggleLaneWidthInput);
        geometryInputs.num_passes.addEventListener('change', validateTubePasses);
    }
    
    if (geometryInputs.pass_layout) {
        geometryInputs.pass_layout.addEventListener('change', toggleLaneWidthInput);
    }

    if (geometryInputs.rear_head_type) {
        geometryInputs.rear_head_type.addEventListener('change', validateTubePasses);
    }
    
    // --- INITIALIZATION FUNCTION ---
    function initializePage() {
        // Reset the button's state on every page load.
        // This fixes issues when navigating back to the page.
        if (calculateAndProceedBtn) {
            calculateAndProceedBtn.disabled = false;
            calculateAndProceedBtn.textContent = 'Save & Proceed to Materials →';
        }

        // Populate the form with any saved data.
        populateFormOnLoad();

        // Run initial validation to ensure UI is consistent.
        validateTubePasses(); 
    }

    // --- PAGE LOAD HANDLER ---
    // Use 'pageshow' to handle initialization reliably, especially with back/forward cache.
    window.addEventListener('pageshow', function(event) {
        initializePage();
    });
});