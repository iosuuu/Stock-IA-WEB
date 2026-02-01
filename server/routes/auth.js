const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET_KEY = process.env.JWT_SECRET || 'trace_ia_secret_key_change_me';

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            linked_company: user.linked_company // Embed in token
        }, SECRET_KEY, { expiresIn: 86400 });

        res.status(200).json({
            auth: true,
            token: token,
            user: {
                username: user.username,
                role: user.role,
                linked_company: user.linked_company
            }
        });
    });
});

module.exports = router;
