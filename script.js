// Function to parse CSV to JSON
function csvToJson(csv) {
    if (!csv || !csv.trim()) throw new Error('CSV is empty.');

    // Normalize newlines and split into lines
    const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) throw new Error('CSV has no data.');

    // Parse headers (support quoted headers)
    const headers = parseCsvLine(lines[0]);
    if (headers.length === 0) throw new Error('No headers found in CSV.');

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
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

// Parse a single CSV line, handling quoted values and commas inside quotes
function parseCsvLine(line) {
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            // If it's a double quote inside a quoted field followed by another double quote, it's an escaped quote
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                cur += '"';
                i++; // skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            values.push(cur.trim());
            cur = '';
        } else {
            cur += ch;
        }
    }
    values.push(cur.trim());
    // Remove surrounding quotes if present
    return values.map(v => v.replace(/^"|"$/g, ''));
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
    const statusMsg = document.getElementById('statusMsg');

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
        if (statusMsg) statusMsg.textContent = `Converted ${jsonData.length} rows.`;

        // Generate default filename with timestamp
        const getDefaultFilename = () => {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            return `converted_${timestamp}.json`;
        };

        // Setup download button
        downloadBtn.onclick = () => {
            // Ask for custom filename
            const defaultName = getDefaultFilename();
            const customName = prompt('Enter filename for the JSON file:', defaultName);
            
            if (customName) {
                const filename = customName.endsWith('.json') ? customName : `${customName}.json`;
                const blob = new Blob([jsonString], { 
                    type: 'application/json;charset=utf-8'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if (statusMsg) statusMsg.textContent = `Downloaded as ${filename}`;
            }
        };

        // Setup copy button
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(jsonString).then(() => {
                if (statusMsg) statusMsg.textContent = 'JSON copied to clipboard.';
            }).catch((err) => {
                console.error('Copy failed', err);
                errorDiv.textContent = 'Failed to copy JSON. Your browser may block clipboard access.';
                errorDiv.classList.remove('hidden');
            });
        };

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});