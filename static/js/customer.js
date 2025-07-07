document.addEventListener('DOMContentLoaded', function() {
    const nextBtn = document.getElementById('next-btn');

    const customerInputs = {
        cust_company: document.getElementById('cust_company'),
        cust_location: document.getElementById('cust_location'),
        cust_service: document.getElementById('cust_service'),
        cust_item_no: document.getElementById('cust_item_no'),
        cust_your_ref: document.getElementById('cust_your_ref'),
        cust_our_ref: document.getElementById('cust_our_ref'),
        cust_rev_no: document.getElementById('cust_rev_no'),
        cust_job_no: document.getElementById('cust_job_no'),
    };

    function collectCustomerData() {
        const data = {};
        for (const key in customerInputs) {
            if (customerInputs[key]) {
                data[key] = customerInputs[key].value;
            }
        }
        return data;
    }

    function saveCustomerData() {
        saveData('customer', collectCustomerData());
    }

    function populateFormOnLoad() {
        const storedData = loadPageData('customer');
        if (storedData) {
            for (const key in storedData) {
                if (customerInputs[key]) {
                    customerInputs[key].value = storedData[key];
                }
            }
        }
    }

    nextBtn.addEventListener('click', () => {
        saveCustomerData();
        window.location.href = '/thermal';
    });

    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('active')) {
                e.preventDefault();
                saveCustomerData();
                window.location.href = e.target.href;
            }
        });
    });

    populateFormOnLoad();
});