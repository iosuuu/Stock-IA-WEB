const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', verifyAdmin, (req, res) => {
    db.all("SELECT id, username, role, full_name, department, personal_info FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

// Create user (Admin only)
router.post('/', verifyAdmin, (req, res) => {
    const { username, password, role, full_name, department, personal_info } = req.body;
    const hash = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, password_hash, role, full_name, department, personal_info) VALUES (?, ?, ?, ?, ?, ?)`,
        [username, hash, role, full_name, department, personal_info],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: "User created" });
        });
});

// Update user (Admin only)
router.put('/:id', verifyAdmin, (req, res) => {
    const { username, role, full_name, department, personal_info, password } = req.body;

    // Check if updating password
    let sql, params;
    if (password) {
        const hash = bcrypt.hashSync(password, 10);
        sql = `UPDATE users SET username=?, role=?, full_name=?, department=?, personal_info=?, password_hash=? WHERE id=?`;
        params = [username, role, full_name, department, personal_info, hash, req.params.id];
    } else {
        sql = `UPDATE users SET username=?, role=?, full_name=?, department=?, personal_info=? WHERE id=?`;
        params = [username, role, full_name, department, personal_info, req.params.id];
    }

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User updated" });
    });
});

// Delete user (Admin only)
router.delete('/:id', verifyAdmin, (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User deleted" });
    });
});

module.exports = router;
