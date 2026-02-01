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
        totalValueEstimate: 0, // Mock value
        statusDistribution: []
    };

    // Filter Logic for Stock
    const stockWhere = userCompany ? `WHERE supplier = ?` : ``;
    const stockParams = userCompany ? [userCompany] : [];

    db.serialize(() => {
        // 1. Total Stock & Status Counts
        db.all(`SELECT status, SUM(quantity) as count FROM stock ${stockWhere} GROUP BY status`, stockParams, (err, rows) => {
            if (err) return res.status(500).json({ error: "DB Error" });

            rows.forEach(row => {
                metrics.totalStock += row.count;
                if (row.status === 'Retained') metrics.retainedItems += row.count;
                else if (row.status === 'Released') metrics.releasedItems += row.count;

                metrics.statusDistribution.push({ name: row.status, value: row.count });
            });

            if (metrics.totalStock > 0) {
                metrics.retainedPercentage = ((metrics.retainedItems / metrics.totalStock) * 100).toFixed(1);
            }

            // 2. Recent Movements (Filtered by JOIN stock supplier if restricted)
            let moveWhere = `WHERE timestamp >= date('now', '-7 days')`;
            const moveParams = [];

            if (userCompany) {
                // We must join stock table to filter by supplier for movements
                // Or filter loosely by details if legacy. Here we filter deeply.
                moveWhere += ` AND (s.supplier = ? OR m.details LIKE ?)`;
                moveParams.push(userCompany, `%${userCompany}%`);
            }

            // If userCompany, we need JOIN. If not, simple query is faster.
            const moveSql = userCompany ?
                `SELECT strftime('%Y-%m-%d', m.timestamp) as date, m.type, SUM(m.quantity) as total_qty 
                 FROM movements m
                 LEFT JOIN stock s ON m.sku = s.sku
                 ${moveWhere}
                 GROUP BY date, m.type 
                 ORDER BY date` :
                `SELECT strftime('%Y-%m-%d', timestamp) as date, type, SUM(quantity) as total_qty 
                 FROM movements 
                 WHERE timestamp >= date('now', '-7 days') 
                 GROUP BY date, type 
                 ORDER BY date`;

            db.all(moveSql, moveParams, (err, moveRows) => {
                const dailyStats = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    dailyStats[dateStr] = { date: dateStr, IN: 0, OUT: 0 };
                }

                if (moveRows) {
                    moveRows.forEach(row => {
                        if (dailyStats[row.date]) {
                            dailyStats[row.date][row.type] = row.total_qty;
                        }
                    });
                }
                metrics.movementStats = Object.values(dailyStats);

                // 3. Recent Activity (Last 10)
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

                    // 4. Top Movers
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
                        res.json(metrics);
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

// Company Health Stats
router.get('/companies', verifyToken, (req, res) => {
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

module.exports = router;
