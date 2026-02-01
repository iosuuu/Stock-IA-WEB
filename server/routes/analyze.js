const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

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

        // Simple XML Parser Strategy (Regex-based for prototype)
        if (req.file.mimetype === 'text/xml' || req.file.originalname.endsWith('.xml')) {
            // Assume structure <Item><SKU>...</SKU>...</Item>
            // This is a simplified regex parser. For production, use 'xml2js'.
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
                if (!line.trim() || line.startsWith('SKU')) return; // Skip header or empty

                // Format: SKU, Description, Quantity, Supplier, Location
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

        // Cleanup uploaded file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        res.json({ message: "Analysis Complete", items });
    });
});

// Confirm Analysis (Apply to stock)
router.post('/confirm', verifyToken, (req, res) => {
    const { items } = req.body;

    db.serialize(() => {
        const moveStmt = db.prepare(`INSERT INTO movements (type, source, sku, quantity, details) VALUES (?, ?, ?, ?, ?)`);

        items.forEach(item => {
            const { sku, quantity, description, supplier, location } = item;

            // Record movement
            moveStmt.run('IN', 'AI', sku, quantity, `AI Import from ${supplier}`);

            // Update Stock
            db.get("SELECT * FROM stock WHERE sku = ?", [sku], (err, row) => {
                if (row) {
                    // Update quantity and potentially location/supplier if provided
                    db.run("UPDATE stock SET quantity = quantity + ? WHERE sku = ?", [quantity, sku]);
                } else {
                    // Create new stock item
                    db.run("INSERT INTO stock (sku, description, quantity, location, supplier, status, entry_date) VALUES (?, ?, ?, ?, ?, 'Released', ?)",
                        [sku, description, quantity, location, supplier, new Date().toISOString().split('T')[0]]);
                }
            });
        });
        moveStmt.finalize();
    });

    res.json({ message: "Stock Updated Successfully" });
});

module.exports = router;
