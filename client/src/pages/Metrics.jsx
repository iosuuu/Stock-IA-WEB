import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, AlertTriangle, History, Sparkles } from 'lucide-react';
import { authHeader } from '../auth';
import { useLanguage } from '../contexts/LanguageContext';

const Metrics = () => {
    const { t } = useLanguage();
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/metrics', { headers: authHeader() });
                if (!res.ok) throw new Error("Failed to fetch metrics");
                const data = await res.json();
                setMetrics(data);
            } catch (e) {
                console.error(e);
                // Set empty safe metrics or error state to prevent crash
                setMetrics({
                    totalStock: 0,
                    retainedItems: 0,
                    releasedItems: 0,
                    retainedPercentage: 0,
                    statusDistribution: [],
                    movementStats: [],
                    recentActivity: [],
                    topMovers: []
                });
            }
        };
        fetchMetrics();
    }, []);

    if (!metrics) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingAnalytics')}</div>;

    const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>{t('warehouseAnalytics')}</h1>

            {/* KPI Cards */}
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', marginRight: '1rem' }}>
                            <Package color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('totalItems')}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{metrics.totalStock}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                        <span>In Stock: {metrics.releasedItems + metrics.retainedItems}</span>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', marginRight: '1rem' }}>
                            <ArrowUpRight color="#10b981" />
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Turnover Rate</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{metrics.turnoverRate}x</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Avg stock renewal per month</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', marginRight: '1rem' }}>
                            <AlertTriangle color="#f59e0b" />
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Occupancy Rate</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{metrics.occupancyRate}%</div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, metrics.occupancyRate)}%`, background: metrics.occupancyRate > 90 ? '#ef4444' : '#10b981' }}></div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', marginRight: '1rem' }}>
                            <History color="#ef4444" size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Avg Storage Time</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{metrics.avgStorageTime} Days</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>{metrics.deadStockCount} items > 90 days (Dead Stock)</div>
                </div>
            </div>

            {/* Smart Alerts & Predicitions Banner */}
            {metrics.alerts && metrics.alerts.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} color="#fbbf24" style={{ fill: "#fbbf24" }} />
                        AI Smart Insights
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {metrics.alerts.map((alert, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '1rem',
                                minWidth: '300px',
                                borderLeft: `4px solid ${alert.type === 'error' ? '#ef4444' : '#f59e0b'}`,
                                background: 'rgba(30, 41, 59, 0.7)'
                            }}>
                                <div style={{ fontWeight: 600, color: alert.type === 'error' ? '#fca5a5' : '#fcd34d', marginBottom: '0.25rem' }}>
                                    {alert.type === 'error' ? 'Critical Alert' : 'Optimization Tip'}
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>{alert.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Status Distribution */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ marginTop: 0 }}>{t('statusDist')}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={metrics.statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {metrics.statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '-20px' }}>
                        {metrics.statusDistribution.map((entry, index) => (
                            <span key={index} style={{ marginRight: '15px', fontSize: '0.9rem' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length], marginRight: '5px' }}></span>
                                {entry.name}: {entry.value}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Recent Movements (Traffic Graph) */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ marginTop: 0 }}>{t('trafficOverview')}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.movementStats || []}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Area type="monotone" dataKey="IN" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" />
                            <Area type="monotone" dataKey="OUT" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity & Top Movers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>

                {/* Recent Activity Table */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('recentActivity')}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: '500' }}>{t('dateTime')}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: '500' }}>{t('status')}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: '500' }}>{t('sku')}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: '500' }}>{t('description')}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: '500', textAlign: 'right' }}>{t('quantity')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
                                    metrics.recentActivity.map((move, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(move.timestamp).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    background: move.type === 'IN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: move.type === 'IN' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {move.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace' }}>{move.sku}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{move.details || move.description || 'Unknown Product'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{move.quantity}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>{t('noData')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Movers List */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('topMovers')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {metrics.topMovers && metrics.topMovers.length > 0 ? (
                            metrics.topMovers.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: '#3b82f6', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{item.sku}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.description}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.total_moved}</div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>{t('noData')}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metrics;
