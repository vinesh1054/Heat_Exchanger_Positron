// static/js/tema-selector.js
document.addEventListener('DOMContentLoaded', function() {
    // This function updates the background image class on a TEMA select element.
    function updateTemaSelectBackground(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        
        // First, remove any existing 'tema-*' class from the select element.
        const classesToRemove = Array.from(selectElement.classList).filter(cls => cls.startsWith('tema-'));
        if (classesToRemove.length > 0) {
            selectElement.classList.remove(...classesToRemove);
        }

        // Then, add the 'tema-*' class from the selected option to the select element.
        if (selectedOption) {
            const temaClass = Array.from(selectedOption.classList).find(cls => cls.startsWith('tema-'));
            if (temaClass) {
                selectElement.classList.add(temaClass);
            }
        }
    }

    const temaSelects = document.querySelectorAll('.tema-select');

    // Initialize all selectors on page load and add change listeners.
    temaSelects.forEach(select => {
        updateTemaSelectBackground(select); 
        select.addEventListener('change', function() {
            updateTemaSelectBackground(this);
        });
    });
});