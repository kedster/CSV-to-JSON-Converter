// Function to parse CSV to JSON
function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 1) throw new Error('CSV is empty.');

    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim());

    // Parse rows
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.trim().replace(/^"|"$/g, ''));
        if (row.length !== headers.length) {
            throw new Error(`Invalid CSV format at line ${i + 1}. Expected ${headers.length} columns, got ${row.length}.`);
        }
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        result.push(obj);
    }
    return result;
}

// Handle form submission
document.getElementById('csvForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const csvFileInput = document.getElementById('csvFile');
    const csvTextInput = document.getElementById('csvText');
    const resultDiv = document.getElementById('result');
    const jsonOutput = document.getElementById('jsonOutput');
    const errorDiv = document.getElementById('error');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');

    // Reset UI
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    try {
        let csvData = '';

        // Check if file is uploaded
        if (csvFileInput.files.length > 0) {
            const file = csvFileInput.files[0];
            if (!file.name.endsWith('.csv')) {
                throw new Error('Please upload a valid CSV file.');
            }
            csvData = await file.text();
        } else if (csvTextInput.value.trim()) {
            csvData = csvTextInput.value.trim();
        } else {
            throw new Error('Please upload a CSV file or paste CSV data.');
        }

        // Convert CSV to JSON
        const jsonData = csvToJson(csvData);
        const jsonString = JSON.stringify(jsonData, null, 2);

        // Display JSON
        jsonOutput.textContent = jsonString;
        resultDiv.classList.remove('hidden');

        // Setup download button
        downloadBtn.onclick = () => {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'output.json';
            a.click();
            URL.revokeObjectURL(url);
        };

        // Setup copy button
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(jsonString).then(() => {
                alert('JSON copied to clipboard!');
            }).catch () => {
                errorDiv.textContent = 'Failed to copy JSON.';
                errorDiv.classList.remove('hidden');
            });
        };

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});