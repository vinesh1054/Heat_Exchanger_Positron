// static/js/ui-helpers.js

function createResultCard(title, data) {
    const card = document.createElement('div');
    card.className = 'card';
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    card.appendChild(cardTitle);

    const table = document.createElement('table');
    table.className = 'results-table';
    const tbody = document.createElement('tbody');

    data.forEach(item => {
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.textContent = item.label;

        const valueCell = document.createElement('td');
        const value = parseFloat(item.value);
        valueCell.textContent = isNaN(value) ? 'N/A' : `${value.toFixed(2)} ${item.unit}`;
        
        row.appendChild(labelCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    return card;
}