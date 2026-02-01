const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'trace_ia_secret_key_change_me';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    // Bearer <token>
    const bearer = token.split(' ');
    const tokenValue = bearer[1];

    jwt.verify(tokenValue, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.userRole === 'admin') {
            next();
        } else {
            return res.status(403).json({ error: 'Require Admin Role' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin };
