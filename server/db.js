const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'trace_ia.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('admin', 'worker')) NOT NULL,
            full_name TEXT,
            department TEXT,
            personal_info TEXT,
            linked_company TEXT -- For multi-tenancy
        )`);

        // ... Stock Table ...

        // Seed Admin User
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
            if (!row) {
                const hash = bcrypt.hashSync('administrador123', 10);
                db.run(`INSERT INTO users (username, password_hash, role, full_name, department) VALUES (?, ?, ?, ?, ?)`,
                    ['admin', hash, 'admin', 'System Administrator', 'IT'],
                    (err) => { if (!err) console.log("Admin user seeded."); });

                // Seed Worker User
                const workerHash = bcrypt.hashSync('worker123', 10);
                db.run(`INSERT INTO users (username, password_hash, role, full_name, department) VALUES (?, ?, ?, ?, ?)`,
                    ['worker', workerHash, 'worker', 'Jane Worker', 'Logistics'],
                    (err) => { if (!err) console.log("Worker user seeded."); });

                // Seed Company Users
                const companyUsers = [
                    { user: 'techgiants', pass: 'company123', company: 'TechGiants Inc.' },
                    { user: 'global', pass: 'company123', company: 'Global Logistics' },
                    { user: 'autoparts', pass: 'company123', company: 'AutoParts Prime' },
                    { user: 'freshfoods', pass: 'company123', company: 'Fresh Foods Ltd.' }
                ];

                companyUsers.forEach(u => {
                    const h = bcrypt.hashSync(u.pass, 10);
                    db.run(`INSERT INTO users (username, password_hash, role, full_name, department, linked_company) VALUES (?, ?, ?, ?, ?, ?)`,
                        [u.user, h, 'worker', `${u.company} Rep`, 'External', u.company],
                        (err) => { if (!err) console.log(`User ${u.user} seeded.`); });
                });
            }
        });

        // Seed Stock and Movements
        db.get("SELECT count(*) as count FROM stock", (err, row) => {
            if (row && row.count === 0) {
                const stockItems = [
                    { sku: 'ITEM-001', desc: 'Smartphone X', qty: 150, loc: 'Zone A-1', status: 'Released', supplier: 'TechGiants' },
                    { sku: 'ITEM-002', desc: 'Laptop Pro', qty: 50, loc: 'Zone A-2', status: 'Released', supplier: 'TechGiants' },
                    { sku: 'ITEM-003', desc: 'Monitor 4K', qty: 20, loc: 'Zone B-1', status: 'Retained', supplier: 'DisplayInc' },
                    { sku: 'ITEM-004', desc: 'Mechanical Keyboard', qty: 200, loc: 'Zone C-1', status: 'Released', supplier: 'KeyMaster' },
                    { sku: 'ITEM-005', desc: 'Wireless Mouse', qty: 300, loc: 'Zone C-2', status: 'Released', supplier: 'KeyMaster' },
                    { sku: 'ITEM-006', desc: 'USB Hub', qty: 100, loc: 'Zone D', status: 'Quarantine', supplier: 'AccessoryWorld' },
                    { sku: 'ITEM-007', desc: 'HDMI Cable', qty: 500, loc: 'Zone D', status: 'Released', supplier: 'CableCo' }
                ];

                const stmt = db.prepare("INSERT INTO stock (sku, description, quantity, location, status, entry_date, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)");
                stockItems.forEach(item => {
                    stmt.run(item.sku, item.desc, item.qty, item.loc, item.status, new Date().toISOString().split('T')[0], item.supplier);
                });
                stmt.finalize();
                console.log("Stock items seeded.");

                // Seed Movements for Analytics (Past 7 Days data)
                const moveStmt = db.prepare("INSERT INTO movements (type, source, sku, quantity, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)");
                const today = new Date();

                // Generate simulated movement history
                for (let i = 0; i < 7; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];

                    // Random IN/OUT movements
                    moveStmt.run('IN', 'MANUAL', 'ITEM-001', Math.floor(Math.random() * 20) + 5, dateStr + " 10:00:00", 'Restock');
                    moveStmt.run('OUT', 'MANUAL', 'ITEM-001', Math.floor(Math.random() * 15) + 2, dateStr + " 14:00:00", 'Shipment');
                    moveStmt.run('IN', 'AI', 'ITEM-004', Math.floor(Math.random() * 50) + 10, dateStr + " 09:00:00", 'Import');
                    moveStmt.run('OUT', 'MANUAL', 'ITEM-005', Math.floor(Math.random() * 30) + 5, dateStr + " 16:30:00", 'Distribution');
                }
                moveStmt.finalize();
                console.log("Historical movements seeded.");
            }
        });

        // Seed Deliveries
        db.get("SELECT count(*) as count FROM scheduled_deliveries", (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare("INSERT INTO scheduled_deliveries (truck_number, driver_name, eta, location, supplier, status) VALUES (?, ?, ?, ?, ?, ?)");
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                stmt.run("TRUCK-101", "John Doe", tomorrow.toISOString(), "Dock 1", "TechSuppliers Inc", "Scheduled");
                stmt.run("TRUCK-205", "Jane Smith", new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(), "Dock 2", "Global Logistics", "Arriving Soon");
                stmt.finalize();
                console.log("Seeded scheduled deliveries.");
            }
        });
    });
}

module.exports = db;
