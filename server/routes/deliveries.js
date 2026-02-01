const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all scheduled deliveries
router.get('/', verifyToken, (req, res) => {
    const query = "SELECT * FROM scheduled_deliveries ORDER BY eta ASC";
    db.all(query, (err, rows) => {
        if (err) {
            console.error("Error fetching deliveries:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
    });
});

module.exports = router;
