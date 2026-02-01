import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Search, Edit2, Trash2, Box } from 'lucide-react';
import { authHeader } from '../auth';

const Stock = () => {
    const [stock, setStock] = useState([]);
    const [stats, setStats] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('IN'); // IN, OUT, EDIT

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        sku: '',
        qty: '',
        desc: '',
        location: 'General',
        status: 'Released',
        entry_date: new Date().toISOString().split('T')[0],
        supplier: '',
        document_ref: ''
    });

    const fetchData = async () => {
        try {
            const [stockRes, statsRes] = await Promise.all([
                fetch('http://localhost:3001/api/stock', { headers: authHeader() }),
                fetch('http://localhost:3001/api/stock/stats', { headers: authHeader() })
            ]);

            if (!stockRes.ok || !statsRes.ok) {
                console.error("API Error");
                // Optional: Handle unauthorized (redirect to login)
                if (stockRes.status === 401 || stockRes.status === 403) {
                    // Redirect or handle logout
                }
                return;
            }

            const stockData = await stockRes.json();
            const statsData = await statsRes.json();

            if (Array.isArray(stockData)) {
                setStock(stockData);
            } else {
                console.error("Stock data is not an array:", stockData);
                setStock([]);
            }

            if (Array.isArray(statsData)) {
                setStats(statsData);
            } else {
                console.error("Stats data is not an array:", statsData);
                setStats([]);
            }
        } catch (e) {
            console.error(e);
            setStock([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            id: '', sku: '', qty: '', desc: '', location: 'General',
            status: 'Released', entry_date: new Date().toISOString().split('T')[0],
            supplier: '', document_ref: ''
        });
    };

    const handleEditClick = (item) => {
        setModalMode('EDIT');
        setFormData({
            id: item.id,
            sku: item.sku,
            qty: item.quantity,
            desc: item.description,
            location: item.location,
            status: item.status || 'Released',
            entry_date: item.entry_date,
            supplier: item.supplier
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (item) => {
        if (window.confirm(`Are you sure you want to delete ${item.sku}? This is a destructive action.`)) {
            // Treat as OUT movement for all quantity to keep history, or just delete?
            // User likely wants "Delete" to remove from stock list.
            // Implemented as an explicit OUT movement clearing the stock.
            try {
                await fetch('http://localhost:3001/api/stock/movements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        type: 'OUT',
                        sku: item.sku,
                        quantity: item.quantity,
                        description: 'Deleted by User',
                        document_ref: 'Manual Deletion'
                    })
                });
                fetchData();
            } catch (e) {
                alert('Delete failed');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (modalMode === 'EDIT') {
                // Edit existing stock
                res = await fetch(`http://localhost:3001/api/stock/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        location: formData.location,
                        status: formData.status
                    })
                });
            } else {
                // Manual IN/OUT
                res = await fetch('http://localhost:3001/api/stock/movements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        type: modalMode,
                        sku: formData.sku,
                        quantity: formData.qty,
                        description: formData.desc,
                        location: formData.location,
                        status: formData.status,
                        entry_date: formData.entry_date,
                        supplier: formData.supplier,
                        document_ref: formData.document_ref
                    })
                });
            }

            if (!res.ok) throw new Error(await res.text() || "Server Error");

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Operation failed: ' + e.message);
        }
    };

    const filteredStock = stock.filter(item =>
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    );

    const getOccupancyColor = (percent) => {
        if (percent >= 80) return '#ef4444'; // Red
        if (percent >= 50) return '#f59e0b'; // Yellow
        return '#10b981'; // Green
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Stock Manager</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={() => { resetForm(); setModalMode('IN'); setShowModal(true); }}>
                        <Plus size={16} /> Incoming
                    </button>
                    <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => { resetForm(); setModalMode('OUT'); setShowModal(true); }}>
                        <Minus size={16} /> Outgoing
                    </button>
                </div>
            </div>

            {/* Occupancy Stats */}
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Warehouse Occupancy</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {stats.length > 0 ? (
                    stats.map(stat => (
                        <div key={stat.name} className="glass-panel" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                    <Box size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                                    {stat.name}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{stat.percent}%</div>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(stat.percent, 100)}%`,
                                    height: '100%',
                                    background: getOccupancyColor(stat.percent),
                                    transition: 'width 0.5s ease-out'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                                {stat.used} / {stat.max} items
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                        No stock data available for stats.
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input
                        className="input-field"
                        placeholder="Search by SKU or Description..."
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '1rem' }}>SKU</th>
                                <th style={{ padding: '1rem' }}>Description</th>
                                <th style={{ padding: '1rem' }}>Location</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Supplier</th>
                                <th style={{ padding: '1rem' }}>Quantity</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStock.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{item.sku}</td>
                                    <td style={{ padding: '1rem' }}>{item.description}</td>
                                    <td style={{ padding: '1rem' }}>{item.location || 'General'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                            background: item.status === 'Released' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: item.status === 'Released' ? '#6ee7b7' : '#fca5a5'
                                        }}>
                                            {item.status || 'Released'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{item.supplier || '-'}</td>
                                    <td style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button className="btn" style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', marginRight: '0.5rem', color: '#60a5fa' }} onClick={() => handleEditClick(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }} onClick={() => handleDeleteClick(item)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '2rem', background: '#1e293b', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>
                            {modalMode === 'EDIT' ? 'Edit Stock Details' : `Manual ${modalMode === 'IN' ? 'Entry' : 'Exit'}`}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {/* Read-Only fields for Edit */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>SKU</label>
                                    <input className="input-field" required value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        disabled={modalMode === 'EDIT'} />
                                </div>
                                {modalMode !== 'EDIT' && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity</label>
                                        <input type="number" className="input-field" required min="1" value={formData.qty}
                                            onChange={e => setFormData({ ...formData, qty: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            {modalMode !== 'OUT' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Location (Nave)</label>
                                            <input className="input-field" value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                                            <select className="input-field" value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="Released">Released</option>
                                                <option value="Retained">Retained</option>
                                                <option value="Quarantine">Quarantine</option>
                                            </select>
                                        </div>
                                    </div>

                                    {modalMode === 'IN' && (
                                        <>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                                                <input className="input-field" value={formData.desc}
                                                    onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Supplier</label>
                                                    <input className="input-field" value={formData.supplier}
                                                        onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Entry Date</label>
                                                    <input type="date" className="input-field" value={formData.entry_date}
                                                        onChange={e => setFormData({ ...formData, entry_date: e.target.value })} />
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Document / Ref</label>
                                                <input className="input-field" value={formData.document_ref}
                                                    onChange={e => setFormData({ ...formData, document_ref: e.target.value })} />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
