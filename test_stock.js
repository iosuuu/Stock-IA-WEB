
const fetch = require('node-fetch'); // Fallback if global fetch missing, but we'll try global first
// Actually, let's just use http if we are not sure, but modern node has fetch.
// We'll write a script that uses built-in fetch if available, or https.
// Since we are in an environment where we can't easily install new global packages, we rely on what's there.
// The project has `node_modules`. `server` has `express`, etc.
// `client` has `vite`.
// I will try to use a simple script that assumes Node 18+ or I will use 'http' module which is verbose but safe.
// Wait, the server project might NOT have `node-fetch`.
// Let's assume Node 18+ for now as it's standard recent.

async function testStock() {
    const BASE_URL = 'http://localhost:3001/api';
    let token = '';

    // Helper to login and get token (if needed, but routes use verifyToken)
    // Wait, verifyToken middleware is used. I need a token.
    // I need to login as admin first.

    console.log('1. Logging in...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'administrador123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('Login successful. Token obtained.');
    } catch (e) {
        console.error('Login error:', e);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Create/Add Stock (IN)
    console.log('\n2. Testing Stock IN (Creation)...');
    const testSku = 'TEST-' + Date.now();
    try {
        const inRes = await fetch(`${BASE_URL}/stock/movements`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'IN',
                sku: testSku,
                quantity: 10,
                description: 'Test Item',
                location: 'Test Zone',
                supplier: 'Test Supplier'
            })
        });

        if (!inRes.ok) throw new Error(await inRes.text());
        console.log('Stock IN successful.');
    } catch (e) {
        console.error('Stock IN failed:', e);
    }

    // 3. Verify Stock exists
    console.log('\n3. Verifying Stock in list...');
    try {
        const listRes = await fetch(`${BASE_URL}/stock`, { headers });
        const list = await listRes.json();
        const item = list.find(i => i.sku === testSku);

        if (item) {
            console.log(`Found item: SKU=${item.sku}, Qty=${item.quantity} (Expected 10)`);
            if (item.quantity !== 10) console.error('FAIL: Quantity mismatch');
        } else {
            console.error('FAIL: Item not found in list');
        }
    } catch (e) {
        console.error('List fetch failed:', e);
    }

    // 4. Test OUT (Partial)
    console.log('\n4. Testing Stock OUT (Partial -5)...');
    try {
        const outRes = await fetch(`${BASE_URL}/stock/movements`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'OUT',
                sku: testSku,
                quantity: 5,
                description: 'Partial Out'
            })
        });
        if (!outRes.ok) throw new Error(await outRes.text());
        console.log('Stock OUT successful.');

        // Verify qty
        const listRes = await fetch(`${BASE_URL}/stock`, { headers });
        const list = await listRes.json();
        const item = list.find(i => i.sku === testSku);
        console.log(`Item Qty after OUT: ${item ? item.quantity : 'N/A'} (Expected 5)`);
    } catch (e) {
        console.error('Stock OUT failed:', e);
    }

    // 5. Test Negative Stock Scenario
    console.log('\n5. Testing Negative Stock (OUT -10, existing 5)...');
    try {
        const negRes = await fetch(`${BASE_URL}/stock/movements`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'OUT',
                sku: testSku,
                quantity: 10,
                description: 'Negative Test'
            })
        });
        console.log('Stock OUT request sent.');

        // Verify qty
        const listRes = await fetch(`${BASE_URL}/stock`, { headers });
        const list = await listRes.json();
        const item = list.find(i => i.sku === testSku);
        console.log(`Item Qty after aggressive OUT: ${item ? item.quantity : 'N/A'} (Potential Issue if Negative)`);
    } catch (e) {
        console.error('Negative Stock test failed:', e);
    }
}

testStock();
