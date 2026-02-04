const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });

// Helper to wrap db.run in Promise
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Analyze Endpoint
router.post('/', verifyToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to read file" });
        }

        const items = [];

        try {
            // Simple XML Parser Strategy
            if (req.file.mimetype === 'text/xml' || req.file.originalname.endsWith('.xml')) {
                const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
                let match;
                while ((match = itemRegex.exec(data)) !== null) {
                    const itemContent = match[1];
                    const extract = (tag) => {
                        const r = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
                        const m = r.exec(itemContent);
                        return m ? m[1] : '';
                    };
                    items.push({
                        sku: extract('ID') || extract('SKU') || 'UNKNOWN',
                        description: extract('Name') || extract('Description') || 'Unknown Item',
                        quantity: parseInt(extract('Qty') || extract('Quantity')) || 0,
                        supplier: extract('Supplier') || 'Unknown Supplier',
                        location: extract('Location') || 'Receiving'
                    });
                }
            }
            // Simple Text/CSV Parser Strategy
            else {
                const lines = data.split('\n');
                lines.forEach(line => {
                    if (!line.trim() || line.startsWith('SKU')) return;
                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length >= 3) {
                        items.push({
                            sku: parts[0],
                            description: parts[1],
                            quantity: parseInt(parts[2]) || 0,
                            supplier: parts[3] || 'Unknown Supplier',
                            location: parts[4] || 'Receiving'
                        });
                    }
                });
            }

            res.json({ message: "Analysis Complete", items });

        } catch (e) {
            console.error("Parse Error:", e);
            res.status(500).json({ error: "Failed to parse file" });
        } finally {
            // Cleanup uploaded file
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    });
});

// Confirm Analysis (Apply to stock)
router.post('/confirm', verifyToken, async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid items data" });
    }

    try {
        await dbRun("BEGIN TRANSACTION");

        for (const item of items) {
            const { sku, quantity, description, supplier, location } = item;

            // 1. Record Movement
            await dbRun(
                `INSERT INTO movements (type, source, sku, quantity, details) VALUES (?, ?, ?, ?, ?)`,
                ['IN', 'AI', sku, quantity, `AI Import from ${supplier}`]
            );

            // 2. Update or Create Stock
            const existingStock = await dbGet("SELECT * FROM stock WHERE sku = ?", [sku]);

            if (existingStock) {
                await dbRun(
                    "UPDATE stock SET quantity = quantity + ? WHERE sku = ?",
                    [quantity, sku]
                );
            } else {
                await dbRun(
                    "INSERT INTO stock (sku, description, quantity, location, supplier, status, entry_date) VALUES (?, ?, ?, ?, ?, 'Released', ?)",
                    [sku, description, quantity, location, supplier, new Date().toISOString().split('T')[0]]
                );
            }
        }

        await dbRun("COMMIT");
        res.json({ message: "Stock Updated Successfully" });

    } catch (error) {
        await dbRun("ROLLBACK");
        console.error("Transaction Error:", error);
        res.status(500).json({ error: "Failed to update stock: " + error.message });
    }
});

module.exports = router;
