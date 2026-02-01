const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all stock (Filtered)
router.get('/', verifyToken, (req, res) => {
    const userCompany = req.user.linked_company;
    let sql = "SELECT * FROM stock";
    let params = [];

    if (userCompany) {
        sql += " WHERE supplier = ?";
        params.push(userCompany);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

// Update Stock Details (Location/Status)
router.put('/:id', verifyToken, (req, res) => {
    const { location, status } = req.body;
    const userCompany = req.user.linked_company;

    // Safety check: ensure user owns this item
    let checkSql = "SELECT * FROM stock WHERE id = ?";
    let checkParams = [req.params.id];

    if (userCompany) {
        checkSql += " AND supplier = ?";
        checkParams.push(userCompany);
    }

    db.get(checkSql, checkParams, (err, row) => {
        if (err || !row) return res.status(403).json({ error: "Access denied or item not found" });

        db.run("UPDATE stock SET location = ?, status = ? WHERE id = ?", [location, status, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Stock updated successfully" });
        });
    });
});

// Warehouse Stats / Occupancy
router.get('/stats', verifyToken, (req, res) => {
    const userCompany = req.user.linked_company;
    let sql = "SELECT location, SUM(quantity) as total_qty FROM stock";
    let params = [];

    if (userCompany) {
        sql += " WHERE supplier = ?";
        params.push(userCompany);
    }
    sql += " GROUP BY location";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "DB Error" });

        // Define Capacities (Mock Logic)
        const capacities = {
            'Zone A': 1000,
            'Zone B': 800,
            'Zone C': 1200,
            'Zone D': 500
        };

        const stats = rows.map(row => {
            // Fuzzy match location to Zone
            let zone = 'General';
            let max = 2000; // Default

            if (row.location) {
                if (row.location.includes('Zone A')) { zone = 'Zone A'; max = capacities['Zone A']; }
                else if (row.location.includes('Zone B')) { zone = 'Zone B'; max = capacities['Zone B']; }
                else if (row.location.includes('Zone C')) { zone = 'Zone C'; max = capacities['Zone C']; }
                else if (row.location.includes('Zone D')) { zone = 'Zone D'; max = capacities['Zone D']; }
            }

            return {
                rawLocation: row.location,
                zone: zone,
                used: row.total_qty,
                max: max
            };
        });

        // Group by Zone (since 'Zone A-1' and 'Zone A-2' should sum to 'Zone A')
        const groupedStats = {};
        stats.forEach(s => {
            if (!groupedStats[s.zone]) {
                groupedStats[s.zone] = { name: s.zone, used: 0, max: s.max };
            }
            groupedStats[s.zone].used += s.used;
        });

        // Calculate percentages
        const result = Object.values(groupedStats).map(s => ({
            ...s,
            percent: Math.round((s.used / s.max) * 100)
        }));

        res.json(result);
    });
});

// Manual Movement (Enhanced)
router.post('/movements', verifyToken, (req, res) => {
    console.log("Received manual movement request:", req.body); // DEBUG LOG
    const { type, sku, quantity, description, location, status, entry_date, supplier, document_ref } = req.body;
    const userCompany = req.user.linked_company;
    const source = 'MANUAL';

    // Strict Supplier Enforcement
    const effectiveSupplier = userCompany || supplier;

    // Format details to include richer context for Analytics
    let details = description || '';
    if (type === 'IN') {
        const parts = [];
        if (effectiveSupplier) parts.push(`Supplier: ${effectiveSupplier}`);
        if (location) parts.push(`Loc: ${location}`);
        if (parts.length > 0) {
            details = details ? `${details} (${parts.join(', ')})` : parts.join(', ');
        }
    } else if (type === 'OUT') {
        // For OUT, we might just want "Manual Exit" or similar if no desc provided
        if (!details) details = 'Manual Exit';
    }

    db.serialize(() => {
        // 1. Record movement
        db.run(`INSERT INTO movements (type, source, sku, quantity, details, document_ref) VALUES (?, ?, ?, ?, ?, ?)`,
            [type, source, sku, quantity, details, document_ref || 'Manual Entry'],
            (err) => {
                if (err) {
                    console.error("Movement log error:", err); // DEBUG LOG
                    return res.status(500).json({ error: "Failed to log movement: " + err.message });
                }
            });

        // 2. Update Stock
        db.get("SELECT * FROM stock WHERE sku = ?", [sku], (err, row) => {
            if (err) {
                console.error("Stock lookup error:", err); // DEBUG LOG
                return res.status(500).json({ error: "DB Error: " + err.message });
            }

            if (row) {
                // Check Access
                if (userCompany && row.supplier !== userCompany) {
                    return res.status(403).json({ error: "Cannot modify stock from another company" });
                }

                // Update existing
                console.log("Updating existing stock:", sku); // DEBUG LOG
                let newQty = row.quantity;
                if (type === 'IN') newQty += parseInt(quantity);
                else if (type === 'OUT') newQty -= parseInt(quantity);

                // If updating existing, we might want to update location/status/supplier only if provided and if it makes sense (e.g. latest entry overwrites?)
                // For simplicity, we update aux fields if provided on IN
                let sql = "UPDATE stock SET quantity = ?";
                let params = [newQty];

                if (type === 'IN') {
                    if (location) { sql += ", location = ?"; params.push(location); }
                    if (status) { sql += ", status = ?"; params.push(status); }
                    if (effectiveSupplier) { sql += ", supplier = ?"; params.push(effectiveSupplier); }
                    if (entry_date) { sql += ", entry_date = ?"; params.push(entry_date); }
                }

                sql += " WHERE sku = ?";
                params.push(sku);

                db.run(sql, params, (err) => {
                    if (err) {
                        console.error("Stock update error:", err); // DEBUG LOG
                        return res.status(500).json({ error: "Update failed: " + err.message });
                    }
                    console.log("Stock updated successfully"); // DEBUG LOG
                    res.json({ message: "Stock updated", newQuantity: newQty });
                });
            } else {
                // Create new
                console.log("Creating new stock item:", sku); // DEBUG LOG
                if (type === 'IN') {
                    db.run(`INSERT INTO stock (sku, description, quantity, location, status, entry_date, supplier) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [sku, description, quantity, location || 'General', status || 'Released', entry_date || new Date().toISOString().split('T')[0], effectiveSupplier],
                        (err) => {
                            if (err) {
                                console.error("Stock insert error:", err); // DEBUG LOG
                                return res.status(500).json({ error: "Insert failed: " + err.message });
                            }
                            console.log("Stock created successfully"); // DEBUG LOG
                            res.json({ message: "Stock created", newQuantity: quantity });
                        });
                } else {
                    return res.status(400).json({ error: "Item not found in stock to remove" });
                }
            }
        });
    });
});

module.exports = router;
