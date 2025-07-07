// static/js/storage.js

const STORAGE_KEY = 'heatExchangerData';

function loadData() {
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    try {
        return storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        console.error("Error parsing stored data:", e);
        return {};
    }
}

function saveData(pageKey, dataObject) {
    const mainData = loadData();
    mainData[pageKey] = dataObject;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mainData));
    console.log(`Saved data for '${pageKey}' to session storage.`);
}

function loadPageData(pageKey) {
    const mainData = loadData();
    return mainData[pageKey] || null;
}

// in static/js/storage.js

// ... (loadData and saveData functions remain the same) ...
function loadPageData(pageKey) {
    const mainData = loadData();
    return mainData[pageKey] || null;
}

// --- ADD THIS NEW FUNCTION ---
function resetSubsequentData() {
    const mainData = loadData();
    // Delete the data for all pages that come after the thermal analysis
    delete mainData.geometry;
    delete mainData.materials;
    delete mainData.nozzles;
    delete mainData.finalResults;
    
    // Save the cleared data back to session storage
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mainData));
    console.log("Reset subsequent page data (geometry, materials, etc.).");
}

function clearAllData() {
    console.log("Clearing all calculation data...");
    const keysToRemove = ['customer', 'thermal', 'geometry', 'materials', 'nozzles', 'finalResults'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('All calculation data cleared.');
}