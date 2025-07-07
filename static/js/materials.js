// // static/js/materials.js

// document.addEventListener('DOMContentLoaded', function() {

//     // --- THIS BLOCK IS NOW CORRECT ---
//     // It finds only the elements we *want* to be searchable dropdowns
//     // because we added the 'searchable-select' class to them in the HTML.
//     const searchableElements = document.querySelectorAll('.searchable-select');
//     searchableElements.forEach(el => {
//         // We store the Choices instance on the element for later access if needed
//         el.choices = new Choices(el, {
//             searchEnabled: true,
//             itemSelectText: '',
//             shouldSort: false,
//         });
//     });
//     // --- END OF CHANGE ---

//     const nextBtn = document.getElementById('next-btn');

//     // This object definition is still correct.
//     const materialInputs = {
//         mat_shell_cylinder: document.getElementById('mat_shell_cylinder'),
//         mat_shell_bonnet: document.getElementById('mat_shell_bonnet'),
//         mat_shell_nozzles: document.getElementById('mat_shell_nozzles'),
//         mat_baffles: document.getElementById('mat_baffles'),
//         mat_tubesheet: document.getElementById('mat_tubesheet'),
//         mat_tube: document.getElementById('mat_tube'),
//         mat_tube_channel: document.getElementById('mat_tube_channel'),
//         mat_tube_nozzles: document.getElementById('mat_tube_nozzles'),
//         mat_pass_plates: document.getElementById('mat_pass_plates'),
//         mat_shell_gasket: document.getElementById('mat_shell_gasket'),
//         mat_tube_gasket: document.getElementById('mat_tube_gasket'),
//         mat_bolting: document.getElementById('mat_bolting')
//     };

//     // This function works for both <input> and <select> without changes.
//     function collectMaterialsData() {
//         const data = {};
//         for (const key in materialInputs) {
//             if (materialInputs[key]) {
//                 data[key] = materialInputs[key].value;
//             }
//         }
//         return data;
//     }

//     function saveMaterialsData() {
//         saveData('materials', collectMaterialsData());
//     }

//     // This function is now also correct. It checks if a Choices.js instance
//     // exists. If not, it treats it as a standard input.
//     function populateFormOnLoad() {
//         const storedData = loadPageData('materials');
//         if (storedData) {
//             console.log("Populating materials form from stored data.");
//             for (const key in storedData) {
//                 const element = materialInputs[key];
//                 if (element) {
//                     // Check if the element has a Choices.js instance attached
//                     if (element.choices) {
//                         // Use the Choices API to set the value for dropdowns
//                         element.choices.setValue(storedData[key]);
//                     } else {
//                         // For standard text inputs, just set the value directly
//                         element.value = storedData[key];
//                     }
//                 }
//             }
//         }
//     }

//     // --- Event Listeners (No changes needed) ---
//     nextBtn.addEventListener('click', () => {
//         saveMaterialsData();
//         window.location.href = '/nozzles'; 
//     });

//     // This part handles saving data when you click the main nav tabs
//     const mainNavTabs = document.querySelectorAll('.navbar-nav .nav-link');
//     mainNavTabs.forEach(tab => {
//         tab.addEventListener('click', (e) => {
//             // Check if the link is for a different page
//             if (tab.href !== window.location.href) {
//                 saveMaterialsData();
//             }
//         });
//     });


//     // --- Initial Kick-off ---
//     populateFormOnLoad();
// });


// static/js/materials.js

document.addEventListener('DOMContentLoaded', function() {

    // --- THIS BLOCK IS NOW CORRECT ---
    // It finds only the elements we *want* to be searchable dropdowns
    // because we added the 'searchable-select' class to them in the HTML.
    const searchableElements = document.querySelectorAll('.searchable-select');
    searchableElements.forEach(el => {
        // We store the Choices instance on the element for later access if needed
        el.choices = new Choices(el, {
            searchEnabled: true,
            itemSelectText: '',
            shouldSort: false,
        });
    });
    // --- END OF CHANGE ---

    const nextBtn = document.getElementById('next-btn');

    // This object definition is still correct.
    const materialInputs = {
        mat_shell_cylinder: document.getElementById('mat_shell_cylinder'),
        mat_shell_bonnet: document.getElementById('mat_shell_bonnet'),
        mat_shell_nozzles: document.getElementById('mat_shell_nozzles'),
        mat_baffles: document.getElementById('mat_baffles'),
        mat_tubesheet: document.getElementById('mat_tubesheet'),
        mat_tube: document.getElementById('mat_tube'),
        mat_tube_channel: document.getElementById('mat_tube_channel'),
        mat_tube_nozzles: document.getElementById('mat_tube_nozzles'),
        mat_pass_plates: document.getElementById('mat_pass_plates'),
        mat_shell_gasket: document.getElementById('mat_shell_gasket'),
        mat_tube_gasket: document.getElementById('mat_tube_gasket'),
        mat_bolting: document.getElementById('mat_bolting')
    };

    // This function works for both <input> and <select> without changes.
    function collectMaterialsData() {
        const data = {};
        for (const key in materialInputs) {
            if (materialInputs[key]) {
                data[key] = materialInputs[key].value;
            }
        }
        return data;
    }

    function saveMaterialsData() {
        saveData('materials', collectMaterialsData());
    }

    // This function is now also correct. It checks if a Choices.js instance
    // exists. If not, it treats it as a standard input.
    function populateFormOnLoad() {
        const storedData = loadPageData('materials');
        if (storedData) {
            console.log("Populating materials form from stored data.");
            for (const key in storedData) {
                const element = materialInputs[key];
                if (element) {
                    // Check if the element has a Choices.js instance attached
                    if (element.choices) {
                        // Use the Choices API to set the value for dropdowns
                        element.choices.setValue(storedData[key]);
                    } else {
                        // For standard text inputs, just set the value directly
                        element.value = storedData[key];
                    }
                }
            }
        }
    }

    // --- Event Listeners (No changes needed) ---
    nextBtn.addEventListener('click', () => {
        saveMaterialsData();
        window.location.href = '/nozzles'; 
    });

    // This part handles saving data when you click the main nav tabs
    const mainNavTabs = document.querySelectorAll('.navbar-nav .nav-link');
    mainNavTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Check if the link is for a different page
            if (tab.href !== window.location.href) {
                saveMaterialsData();
            }
        });
    });


    // --- Initial Kick-off ---
    populateFormOnLoad();
});