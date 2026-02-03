import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, FileText } from 'lucide-react';
import { authHeader } from '../auth';
import { useLanguage } from '../contexts/LanguageContext';

const ActivityHistory = () => {
    const { t } = useLanguage();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        supplier: '',
        startDate: '',
        endDate: '',
        type: ''
    });

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            // Remove empty keys
            const cleanQuery = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) cleanQuery.append(key, value);
            });

            const res = await fetch(`http://localhost:3001/api/metrics/movements?${cleanQuery.toString()}`, {
                headers: authHeader()
            });

            if (res.ok) {
                const data = await res.json();
                setMovements(data);
            } else {
                console.error("Failed to fetch movements");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Specific logic: "See everything done in the last month"
    // Preset filter action
    const setLastMonth = () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 1);

        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    };

    // Initial load
    useEffect(() => {
        fetchMovements();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMovements();
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <History size={28} style={{ marginRight: '1rem', color: 'var(--color-accent)' }} />
                <h1 style={{ margin: 0 }}>{t('activityHistory')}</h1>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Increased to 280px to prevent overlapping
                    gap: '1.5rem',
                    alignItems: 'end'
                }}>

                    {/* Search Text */}
                    <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('searchLabel')}</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                className="input-field"
                                placeholder="e.g. Screws..."
                                style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }}
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Supplier */}
                    <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('supplierLabel')}</label>
                        <input
                            className="input-field"
                            placeholder="Provider Name..."
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={filters.supplier}
                            onChange={e => setFilters({ ...filters, supplier: e.target.value })}
                        />
                    </div>

                    {/* Date Range */}
                    <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('dateRange')}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="date"
                                className="input-field"
                                style={{ width: '50%', minWidth: '0', boxSizing: 'border-box' }}
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <input
                                type="date"
                                className="input-field"
                                style={{ width: '50%', minWidth: '0', boxSizing: 'border-box' }}
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('movementType')}</label>
                        <select
                            className="input-field"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={filters.type}
                            onChange={e => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">{t('allTypes')}</option>
                            <option value="IN">Incoming (IN)</option>
                            <option value="OUT">Outgoing (OUT)</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', minWidth: 0 }}>
                        <button type="button" onClick={setLastMonth} className="btn" style={{
                            background: 'rgba(255,255,255,0.05)',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            padding: '0.6rem 1rem'
                        }}>
                            {t('lastMonth')}
                        </button>
                        <button type="submit" className="btn btn-primary" style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            whiteSpace: 'nowrap'
                        }}>
                            <Filter size={16} style={{ marginRight: '8px' }} />
                            {t('filter')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Table */}
            <div className="glass-panel" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', padding: '1rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('dateTime')}</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('status')}</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('reference')}</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('details')}</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>{t('quantity')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingHistory')}</td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>{t('noMovements')}</td></tr>
                            ) : (
                                movements.map((move) => (
                                    <tr key={move.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{new Date(move.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(move.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                                                background: move.type === 'IN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: move.type === 'IN' ? '#34d399' : '#f87171',
                                                border: `1px solid ${move.type === 'IN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                            }}>
                                                {move.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-accent)' }}>{move.sku}</div>
                                            {move.document_ref && move.document_ref !== 'Manual Entry' && (
                                                <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                    <FileText size={12} style={{ marginRight: '4px' }} />
                                                    {move.document_ref}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{move.description || t('unknownItem')}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                                                {/* Logic to show supplier if different from main description */}
                                                {(move.current_supplier || move.details) && (
                                                    <span>{move.details || `Supplier: ${move.current_supplier}`}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            {move.type === 'IN' ? '+' : '-'}{move.quantity}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActivityHistory;
