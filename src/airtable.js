const BASE_ID = import.meta.env.VITE_BASE_ID;
const PAT = import.meta.env.VITE_AIRTABLE_PAT;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

function authHeaders() {
    return {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
    };
}

function tableUrl(tableName) {
    return `${BASE_URL}/${encodeURIComponent(tableName)}`;
}

// Create a record. Returns the new record's ID.
export async function createRecord(tableName, fields) {
    const res = await fetch(tableUrl(tableName), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    return data.id;
}

// Update a record. Returns the updated record.
export async function updateRecord(tableName, recordId, fields) {
    const res = await fetch(`${tableUrl(tableName)}/${recordId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed (${res.status}): ${text}`);
    }
    return res.json();
}

// List all records (handles pagination). Returns array of { id, fields }.
export async function listRecords(tableName, options = {}) {
    const url = new URL(tableUrl(tableName));

    if (options.fields) {
        options.fields.forEach(f => url.searchParams.append('fields[]', f));
    }
    if (options.sort && options.sort.length) {
        options.sort.forEach((s, i) => {
            url.searchParams.append(`sort[${i}][field]`, s.field);
            url.searchParams.append(`sort[${i}][direction]`, s.direction || 'asc');
        });
    }

    const allRecords = [];
    let offset = null;

    do {
        const fetchUrl = new URL(url);
        if (offset) fetchUrl.searchParams.set('offset', offset);

        const res = await fetch(fetchUrl.toString(), {
            headers: { Authorization: `Bearer ${PAT}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`List failed (${res.status}): ${text}`);
        }
        const data = await res.json();
        allRecords.push(...data.records);
        offset = data.offset || null;
    } while (offset);

    return allRecords;
}
