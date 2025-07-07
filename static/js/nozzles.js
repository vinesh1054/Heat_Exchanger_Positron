document.addEventListener('DOMContentLoaded', function() {
    let pipeData = [];

    const SIDES = ['shell', 'tube'];
    const LOCATIONS = ['inlet', 'outlet', 'intermediate'];

    const elements = {
        calculateBtn: document.getElementById('calculate-btn'),
        errorDiv: document.getElementById('error-message')
    };

    function parseNPS(val) {
        const s = String(val).trim();
        if (s.includes(' ')) {
            const parts = s.split(' ');
            return parseFloat(parts[0]) + eval(parts[1]);
        }
        return s.includes('/') ? eval(s) : parseFloat(s);
    }

    function populateNPSDropdowns() {
        if (pipeData.length === 0) return;
        const uniqueNPS = [...new Set(pipeData.map(p => p.nps))].sort((a, b) => parseNPS(a) - parseNPS(b));
        
        uniqueNPS.forEach(nps => {
            SIDES.forEach(side => {
                LOCATIONS.forEach(loc => {
                    const el = document.getElementById(`${side}_${loc}_nps`);
                    if (el) el.add(new Option(nps, nps));
                });
            });
        });
    }

    function updateNozzleDetails(side, location) {
        const npsEl = document.getElementById(`${side}_${location}_nps`);
        const schEl = document.getElementById(`${side}_${location}_sch`);
        if (!npsEl || !schEl) return;

        const selectedNPS = npsEl.value;
        const selectedSchedule = schEl.value.toLowerCase();
        
        const pipe = pipeData.find(p => String(p.nps) === selectedNPS);
        if (!pipe) return;

        const scheduleKey = `sch_${selectedSchedule}`;
        const wallThickness = pipe[scheduleKey];
        const outerDiameter = pipe.od_mm;
        
        const odEl = document.getElementById(`${side}_${location}_od_mm`);
        const wtEl = document.getElementById(`${side}_${location}_wt_mm`);
        const idEl = document.getElementById(`${side}_${location}_id_mm`);

        if(odEl) odEl.value = outerDiameter ? parseFloat(outerDiameter).toFixed(2) : 'N/A';
        if(wtEl) wtEl.value = wallThickness ? parseFloat(wallThickness).toFixed(2) : 'N/A';
        if(idEl) idEl.value = (outerDiameter != null && wallThickness != null) ? (outerDiameter - 2 * wallThickness).toFixed(2) : 'N/A';
    }
    
    function toggleIntermediateColumns() {
        const geoData = loadPageData('geometry');
        const series = parseInt(geoData?.shells_in_series, 10) || 1;
        const parallel = parseInt(geoData?.shells_in_parallel, 10) || 1; 

        const showIntermediate = series > 1 || parallel > 1;
        
        document.querySelectorAll('.intermediate-col').forEach(col => {
            col.classList.toggle('hidden', !showIntermediate);
        });
    }

    function collectNozzleData() {
        const nozzleData = { shell: {}, tube: {} };

        SIDES.forEach(side => {
            LOCATIONS.forEach(loc => {
                const npsEl = document.getElementById(`${side}_${loc}_nps`);
                if (!npsEl || (npsEl.closest('.intermediate-col') && npsEl.closest('.intermediate-col').classList.contains('hidden'))) {
                    return; // Skip if element doesn't exist or is in a hidden column
                }
                
                const schEl = document.getElementById(`${side}_${loc}_sch`);
                const idEl = document.getElementById(`${side}_${loc}_id_mm`);
                const limitEl = document.getElementById(`${side}_${loc}_momentum_limit`);

                if (npsEl.value && schEl.value && idEl.value) {
                    if (!nozzleData[side]) nozzleData[side] = {};
                    nozzleData[side][loc] = {
                        nps: npsEl.value,
                        sch: schEl.value,
                        id_mm: idEl.value,
                        momentum_limit: limitEl ? limitEl.value : null
                    };
                }
            });
        });
        return nozzleData;
    }

    function saveNozzleData() { saveData('nozzles', collectNozzleData()); }
    
    function populateFormOnLoad() {
        const storedData = loadPageData('nozzles');
        if (storedData && Object.keys(storedData).length > 0) {
            SIDES.forEach(side => {
                if (storedData[side]) {
                    LOCATIONS.forEach(loc => {
                        if (storedData[side][loc]) {
                            const nozzleInfo = storedData[side][loc];
                            const npsEl = document.getElementById(`${side}_${loc}_nps`);
                            const schEl = document.getElementById(`${side}_${loc}_sch`);
                            const limitEl = document.getElementById(`${side}_${loc}_momentum_limit`);

                            if (npsEl) npsEl.value = nozzleInfo.nps;
                            if (schEl) schEl.value = nozzleInfo.sch;
                            if (limitEl && nozzleInfo.momentum_limit != null) {
                                limitEl.value = nozzleInfo.momentum_limit;
                            }
                            updateNozzleDetails(side, loc);
                        }
                    });
                }
            });
        } else {
            // Set defaults only if no stored data exists
            document.getElementById('shell_inlet_nps').value = '3';
            document.getElementById('shell_outlet_nps').value = '3';
            document.getElementById('tube_inlet_nps').value = '2';
            document.getElementById('tube_outlet_nps').value = '2';
            
            const shellIntermediateNps = document.getElementById('shell_intermediate_nps');
            if (shellIntermediateNps) shellIntermediateNps.value = '3';
            
            // Update all calculated fields after setting defaults
            SIDES.forEach(side => {
                LOCATIONS.forEach(loc => {
                    if (document.getElementById(`${side}_${loc}_nps`)) {
                        updateNozzleDetails(side, loc);
                    }
                });
            });
        }
    }

    async function handleFinalCalculation() {
        saveNozzleData();
        const payload = {
            thermal: loadPageData('thermal'),
            geometry: loadPageData('geometry'),
            materials: loadPageData('materials'),
            nozzles: loadPageData('nozzles')
        };
        if (!payload.thermal || !payload.geometry || !payload.materials || !payload.nozzles) {
            showError("Missing data from previous steps. Please go back and complete them.");
            return;
        }
        try {
            showError('');
            const response = await fetch('/api/calculate-final-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const results = await response.json();
            if (!response.ok) throw new Error(results.error || "An unknown error occurred on the server.");
            
            saveData('finalResults', results);
            window.location.href = '/web-report';

        } catch(error) {
            showError(error.message);
        }
    }

    function showError(message) {
        elements.errorDiv.textContent = message;
        elements.errorDiv.style.display = message ? 'block' : 'none';
    }

    async function initializePage() {
        try {
            showError('');
            toggleIntermediateColumns();
            const response = await fetch('/api/pipe-schedules');
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || 'Could not load pipe data from server.');
            }
            pipeData = await response.json();
            populateNPSDropdowns();
            populateFormOnLoad();
        } catch (error) {
            showError(error.message);
        }
    }
    
    SIDES.forEach(side => {
        LOCATIONS.forEach(loc => {
             const npsEl = document.getElementById(`${side}_${loc}_nps`);
             const schEl = document.getElementById(`${side}_${loc}_sch`);
             if(npsEl) npsEl.addEventListener('change', () => updateNozzleDetails(side, loc));
             if(schEl) schEl.addEventListener('change', () => updateNozzleDetails(side, loc));
        });
    });

    elements.calculateBtn.addEventListener('click', handleFinalCalculation);
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('active')) { e.preventDefault(); saveNozzleData(); window.location.href = e.target.href; }
        });
    });

    initializePage();
});