const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, (req, res) => {
    const userCompany = req.user.linked_company;
    const metrics = {
        totalStock: 0,
        retainedItems: 0,
        releasedItems: 0,
        retainedPercentage: 0,
        statusDistribution: [],
        turnoverRate: 0, // [NEW] KPI
        occupancyRate: 0, // [NEW] KPI
        avgStorageTime: 0, // [NEW] KPI
        deadStockCount: 0, // [NEW] KPI
        topMovers: [],
        alerts: [] // [NEW] Smart Alerts
    };

    // Filter Logic for Stock
    const stockWhere = userCompany ? `WHERE supplier = ?` : ``;
    const stockParams = userCompany ? [userCompany] : [];

    db.serialize(() => {
        // 1. Total Stock & Status Counts & Occupancy Calculation
        // Assuming max capacity is 5000 units for this example
        const MAX_CAPACITY = 5000;

        db.all(`SELECT quantity, status, entry_date, supplier FROM stock ${stockWhere}`, stockParams, (err, rows) => {
            if (err) return res.status(500).json({ error: "DB Error" });

            let totalQty = 0;
            let totalDays = 0;
            const now = new Date();

            rows.forEach(row => {
                const qty = row.quantity || 0;
                totalQty += qty;

                if (row.status === 'Retained') metrics.retainedItems += qty; // Note: Counting items, not rows, if needed. Logic preserved.
                // Actually existing logic counted 'rows' as rows.count which was SUM(quantity). 
                // Let's stick to the previous aggregation query to be safe or re-aggregate here.
                // Re-aggregating here is better for row-level calc like storage time.
            });

            // Re-query for Aggregated numbers to match UI expectations exactly if preferred, 
            // but let's do it manually for efficiency since we have the rows.
            metrics.retainedItems = 0;
            metrics.releasedItems = 0;
            const statusMap = {};

            rows.forEach(row => {
                const qty = row.quantity || 0;
                if (row.status === 'Retained') metrics.retainedItems += qty;
                else if (row.status === 'Released') metrics.releasedItems += qty;

                if (!statusMap[row.status]) statusMap[row.status] = 0;
                statusMap[row.status] += qty;

                // Storage Time Calculation
                if (row.entry_date) {
                    const entry = new Date(row.entry_date);
                    const diffTime = Math.abs(now - entry);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDays += (diffDays * qty); // Weighted by quantity

                    // Dead Stock Detection (> 90 days)
                    if (diffDays > 90) {
                        metrics.deadStockCount++;
                        metrics.alerts.push({
                            type: 'warning',
                            message: `Dead Stock: ${qty} units from ${row.supplier} (In stock ${diffDays} days)`
                        });
                    }
                }
            });

            metrics.totalStock = totalQty;
            metrics.statusDistribution = Object.keys(statusMap).map(key => ({ name: key, value: statusMap[key] }));

            if (metrics.totalStock > 0) {
                metrics.retainedPercentage = ((metrics.retainedItems / metrics.totalStock) * 100).toFixed(1);
                metrics.avgStorageTime = (totalDays / metrics.totalStock).toFixed(1);
            }

            metrics.occupancyRate = ((metrics.totalStock / MAX_CAPACITY) * 100).toFixed(1);


            // 2. Recent Movements (Filtered by JOIN stock supplier if restricted)
            let moveWhere = `WHERE timestamp >= date('now', '-30 days')`; // Expanded to 30 days for turnover calc
            const moveParams = [];

            if (userCompany) {
                moveWhere += ` AND (s.supplier = ? OR m.details LIKE ?)`;
                moveParams.push(userCompany, `%${userCompany}%`);
            }

            // Turnover = (Total Outflow / Avg Inventory). Using simplified Total Outflow for now.
            const moveSql = userCompany ?
                `SELECT strftime('%Y-%m-%d', m.timestamp) as date, m.type, m.sku, SUM(m.quantity) as total_qty 
                 FROM movements m
                 LEFT JOIN stock s ON m.sku = s.sku
                 ${moveWhere}
                 GROUP BY date, m.type, m.sku 
                 ORDER BY date` :
                `SELECT strftime('%Y-%m-%d', timestamp) as date, type, sku, SUM(quantity) as total_qty 
                 FROM movements 
                 WHERE timestamp >= date('now', '-30 days')
                 GROUP BY date, type, sku
                 ORDER BY date`;

            db.all(moveSql, moveParams, (err, moveRows) => {
                if (err) return res.status(500).json({ error: "DB Error Movements" });

                const dailyStats = {};
                const skuOutFlow = {}; // SKU -> Total Output
                let totalOut = 0;

                // Initialize last 7 days for the chart
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    dailyStats[dateStr] = { date: dateStr, IN: 0, OUT: 0 };
                }

                if (moveRows) {
                    moveRows.forEach(row => {
                        // Chart Data (Last 7 Days)
                        if (dailyStats[row.date]) {
                            dailyStats[row.date][row.type] += row.total_qty;
                        }

                        // Turnover Data (Last 30 Days)
                        if (row.type === 'OUT') {
                            totalOut += row.total_qty;
                            skuOutFlow[row.sku] = (skuOutFlow[row.sku] || 0) + row.total_qty;
                        }
                    });
                }
                metrics.movementStats = Object.values(dailyStats);

                // Calculate Turnover (Simple: Total Out / Current Stock). 
                // Precise would be: Total Cost of Goods Sold / Avg Inventory Value.
                if (metrics.totalStock > 0) {
                    metrics.turnoverRate = (totalOut / metrics.totalStock).toFixed(2);
                }

                // AI Predictions (Simple Linear Projection)
                // "When will we run out?" -> Stock / Avg Daily Demand
                metrics.predictions = [];

                // Get unique SKUs from stock to predict
                // We need to match current stock quantities with out flow
                // We already have 'rows' (current stock).
                const stockMap = {};
                rows.forEach(r => {
                    // Since rows is raw lines, we might have multiple rows per SKU (different locations). Aggregate.
                    // Assuming 'sku' was not selected in the first query... wait, I changed it to select quantity...
                    // Let's fix the first query to include SKU.
                });

                // Re-query stock grouped by SKU for accurate predictions
                db.all(`SELECT sku, description, SUM(quantity) as qty, supplier FROM stock ${stockWhere} GROUP BY sku`, stockParams, (err, stockRows) => {
                    if (!err && stockRows) {
                        stockRows.forEach(item => {
                            const totalOut30 = skuOutFlow[item.sku] || 0;
                            const dailyAvg = totalOut30 / 30;

                            if (dailyAvg > 0) {
                                const daysLeft = Math.floor(item.qty / dailyAvg);
                                if (daysLeft < 7) {
                                    metrics.alerts.push({
                                        type: 'error',
                                        message: `Low Stock Risk: ${item.sku} will run out in ~${daysLeft} days.`
                                    });
                                    metrics.predictions.push({
                                        sku: item.sku,
                                        name: item.description,
                                        daysLeft: daysLeft,
                                        risk: 'High'
                                    });
                                } else if (daysLeft < 14) {
                                    metrics.predictions.push({
                                        sku: item.sku,
                                        name: item.description,
                                        daysLeft: daysLeft,
                                        risk: 'Medium'
                                    });
                                }
                            }

                            // Detect Anomalies (Spikes)
                            // If today's OUT > 3x Daily Avg
                        });
                    }

                    // ... inside GET /
                    // 3. Recent Activity & Top Movers (reuse queries)
                    // ... [Reuse existing logic for Top Movers and Recent Activity] ...
                    let topSql = `SELECT m.sku, s.description, SUM(m.quantity) as total_moved
                            FROM movements m
                            LEFT JOIN stock s ON m.sku = s.sku
                            WHERE m.timestamp >= date('now', '-30 days') `;
                    const topParams = [];

                    if (userCompany) {
                        topSql += ` AND s.supplier = ?`;
                        topParams.push(userCompany);
                    }
                    topSql += ` GROUP BY m.sku ORDER BY total_moved DESC LIMIT 5`;

                    db.all(topSql, topParams, (err, topRows) => {
                        metrics.topMovers = topRows || [];

                        // [NEW] Supplier Stats for Chart
                        // If user is restricted, this will just be their own company, which is fine
                        const supplierSql = `SELECT supplier, SUM(quantity) as value FROM stock ${stockWhere} GROUP BY supplier`;
                        db.all(supplierSql, stockParams, (err, suppRows) => {
                            metrics.supplierStats = suppRows ? suppRows.map(r => ({ name: r.supplier || 'Unknown', value: r.value })) : [];

                            // Get Recent Activity (Last 10)
                            let recentSql = `SELECT m.timestamp, m.type, m.sku, s.description, m.quantity, m.details 
                                     FROM movements m
                                     LEFT JOIN stock s ON m.sku = s.sku
                                     WHERE 1=1 `;
                            const recentParams = [];

                            if (userCompany) {
                                recentSql += ` AND (s.supplier = ? OR m.details LIKE ?)`;
                                recentParams.push(userCompany, `%${userCompany}%`);
                            }
                            recentSql += ` ORDER BY m.timestamp DESC LIMIT 10`;

                            db.all(recentSql, recentParams, (err, recentRows) => {
                                metrics.recentActivity = recentRows || [];
                                res.json(metrics);
                            });
                        });
                    });
                });
            });
        });
    });
});

// Search Movements History
router.get('/movements', verifyToken, (req, res) => {
    const { search, startDate, endDate, supplier, type } = req.query;
    const userCompany = req.user.linked_company;

    let sql = `SELECT m.id, m.timestamp, m.type, m.sku, m.quantity, m.details, m.document_ref,
                      s.description, s.supplier as current_supplier
               FROM movements m
               LEFT JOIN stock s ON m.sku = s.sku
               WHERE 1=1`;

    const params = [];

    // Force Company Filter
    if (userCompany) {
        sql += ` AND (s.supplier = ? OR m.details LIKE ?)`;
        params.push(userCompany, `%${userCompany}%`);
    }
    // Only allow manual supplier filter if not restricted
    else if (supplier) {
        sql += ` AND (s.supplier LIKE ? OR m.details LIKE ?)`;
        const wild = `%${supplier}%`;
        params.push(wild, wild);
    }

    if (search) {
        sql += ` AND (m.sku LIKE ? OR s.description LIKE ? OR m.details LIKE ?)`;
        const wild = `%${search}%`;
        params.push(wild, wild, wild);
    }

    if (type) {
        sql += ` AND m.type = ?`;
        params.push(type);
    }

    if (startDate) {
        sql += ` AND m.timestamp >= ?`;
        params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
        sql += ` AND m.timestamp <= ?`;
        params.push(endDate + ' 23:59:59');
    }

    sql += ` ORDER BY m.timestamp DESC LIMIT 100`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Search movements error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
    });
});

// ... (existing code)

// Company Health Stats (existing)
router.get('/companies', verifyToken, (req, res) => {
    // ... (existing implementation)
    const userCompany = req.user.linked_company;

    // If user is company-linked, ONLY return their own company
    let whereClause = `WHERE supplier IS NOT NULL AND supplier != ''`;
    const params = [];

    if (userCompany) {
        whereClause += ` AND supplier = ?`;
        params.push(userCompany);
    }

    const sql = `
        SELECT 
            supplier, 
            SUM(quantity) as total_qty,
            SUM(CASE WHEN status != 'Released' THEN quantity ELSE 0 END) as issue_qty
        FROM stock 
        ${whereClause}
        GROUP BY supplier
    `;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Company stats error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        const stats = rows.map(row => {
            const health = row.total_qty > 0
                ? Math.max(0, 100 - Math.round((row.issue_qty / row.total_qty) * 100))
                : 100;

            return {
                name: row.supplier,
                total_qty: row.total_qty,
                health: health
            };
        });

        res.json(stats);
    });
});

// [NEW] Export Metrics Summary (CSV)
router.get('/export/metrics', verifyToken, (req, res) => {
    // Simple export of the main metrics or stock list
    // Let's export current STOCK status as a snapshot
    const userCompany = req.user.linked_company;
    let sql = `SELECT sku, description, quantity, location, status, supplier, entry_date FROM stock`;
    let params = [];

    if (userCompany) {
        sql += ` WHERE supplier = ?`;
        params.push(userCompany);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).send("Database Error");

        // CSV Header
        let csv = "SKU,Description,Quantity,Location,Status,Supplier,Entry Date\n";

        rows.forEach(row => {
            csv += `"${row.sku}","${row.description || ''}",${row.quantity},"${row.location || ''}","${row.status}","${row.supplier || ''}","${row.entry_date || ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="stock_metrics_snapshot.csv"');
        res.send(csv);
    });
});

// [NEW] Export History (CSV)
router.get('/export/history', verifyToken, (req, res) => {
    // Re-use logic from /movements but return CSV
    const { search, startDate, endDate, supplier, type } = req.query;
    const userCompany = req.user.linked_company;

    let sql = `SELECT m.timestamp, m.type, m.sku, m.quantity, m.details, m.document_ref, s.description, s.supplier as current_supplier
               FROM movements m
               LEFT JOIN stock s ON m.sku = s.sku
               WHERE 1=1`;

    const params = [];

    if (userCompany) {
        sql += ` AND (s.supplier = ? OR m.details LIKE ?)`;
        params.push(userCompany, `%${userCompany}%`);
    } else if (supplier) {
        sql += ` AND (s.supplier LIKE ? OR m.details LIKE ?)`;
        const wild = `%${supplier}%`;
        params.push(wild, wild);
    }

    if (search) {
        sql += ` AND (m.sku LIKE ? OR s.description LIKE ? OR m.details LIKE ?)`;
        const wild = `%${search}%`;
        params.push(wild, wild, wild);
    }

    if (type) {
        sql += ` AND m.type = ?`;
        params.push(type);
    }

    if (startDate) {
        sql += ` AND m.timestamp >= ?`;
        params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
        sql += ` AND m.timestamp <= ?`;
        params.push(endDate + ' 23:59:59');
    }

    sql += ` ORDER BY m.timestamp DESC LIMIT 1000`; // Higher limit for export

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).send("Database Error");

        let csv = "Date,Time,Type,SKU,Description,Quantity,Details,Reference\n";
        rows.forEach(r => {
            const dt = new Date(r.timestamp);
            const dateStr = dt.toLocaleDateString();
            const timeStr = dt.toLocaleTimeString();
            const desc = (r.description || r.details || '').replace(/"/g, '""');
            const details = (r.details || '').replace(/"/g, '""');

            csv += `"${dateStr}","${timeStr}","${r.type}","${r.sku}","${desc}",${r.quantity},"${details}","${r.document_ref || ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="activity_history.csv"');
        res.send(csv);
    });
});

module.exports = router;
