import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Activity, Box, ShieldCheck, RefreshCw } from 'lucide-react';
import { authHeader } from '../auth';
import { useLanguage } from '../contexts/LanguageContext';

const AdminPortal = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Static Config for visuals (Logos, Colors) - Merged with DB data
    const companyConfig = {
        'TechGiants Inc.': { sector: 'Electronics', logo: '⚡', color: '#3b82f6' },
        'Global Logistics': { sector: 'Shipping', logo: '🌍', color: '#10b981' },
        'AutoParts Prime': { sector: 'Automotive', logo: '🚗', color: '#ef4444' },
        'Fresh Foods Ltd.': { sector: 'Perishables', logo: '🥦', color: '#f59e0b' },
    };

    const fetchCompanyStats = async () => {
        const mockCompanies = [
            { id: 1, name: 'TechGiants Inc.', sector: 'Electronics', logo: '⚡', color: '#3b82f6', health: 98.0, stockCount: 1240 },
            { id: 2, name: 'Global Logistics', sector: 'Shipping', logo: '🌍', color: '#10b981', health: 92.5, stockCount: 850 },
            { id: 3, name: 'AutoParts Prime', sector: 'Automotive', logo: '🚗', color: '#ef4444', health: 88.0, stockCount: 2100 },
            { id: 4, name: 'Fresh Foods Ltd.', sector: 'Perishables', logo: '🥦', color: '#f59e0b', health: 95.0, stockCount: 500 },
        ];

        try {
            // Attempt to fetch real data
            const res = await fetch('http://localhost:3001/api/metrics/companies', {
                headers: authHeader()
            });

            if (res.ok) {
                const data = await res.json();

                // Merge DB Data with Config
                const merged = data.map((item, index) => ({
                    id: index,
                    name: item.name,
                    health: item.health,
                    stockCount: item.total_qty,
                    ...(companyConfig[item.name] || { sector: 'General', logo: '🏢', color: '#64748b' })
                }));

                if (merged.length === 0) {
                    // Empty DB? Use Mock
                    setCompanies(mockCompanies);
                } else {
                    setCompanies(merged);
                }
            } else {
                throw new Error("API responded with error");
            }
        } catch (e) {
            console.error("Failed to fetch company stats, falling back to demo data", e);
            setCompanies(mockCompanies);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyStats();
    }, []);

    const handleSelectCompany = (company) => {
        // Save selected company context
        localStorage.setItem('trace_current_company', JSON.stringify(company));
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4rem 2rem'
        }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4rem', animation: 'fadeIn 0.8s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <ShieldCheck size={48} color="var(--color-accent)" style={{ marginRight: '1rem' }} />
                    <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-1px' }}>{t('adminPortal')}</h1>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
                    {t('selectOrg')}
                </p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                    <RefreshCw className="spin" size={24} style={{ marginRight: '10px' }} /> {t('loadingOrg')}
                </div>
            ) : (
                /* Grid */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    width: '100%',
                    maxWidth: '1000px'
                }}>
                    {companies.map((company) => (
                        <div
                            key={company.id}
                            onClick={() => handleSelectCompany(company)}
                            className="glass-panel hover-card"
                            style={{
                                padding: '2rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                borderTop: `4px solid ${company.color}`
                            }}
                        >
                            <div style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {company.logo}
                            </div>

                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{company.name}</h2>
                            <span style={{
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                color: 'var(--color-text-muted)',
                                marginBottom: '1.5rem',
                                display: 'block'
                            }}>
                                {company.sector}
                            </span>

                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                width: '100%',
                                justifyContent: 'center',
                                marginTop: 'auto',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Activity size={16} color={company.health > 90 ? '#10b981' : company.health > 70 ? '#f59e0b' : '#ef4444'} style={{ marginBottom: '4px' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{company.health}% {t('health')}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box size={16} color={company.color} style={{ marginBottom: '4px' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{company.stockCount} {t('itemsCap')}</span>
                                </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="card-arrow" style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                opacity: 0.5
                            }}>
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .hover-card {
                    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    background: rgba(30, 41, 59, 0.8);
                }
                .hover-card:hover .card-arrow {
                    opacity: 1;
                    color: var(--color-primary);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 
                    100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } 
                }
            `}</style>
        </div>
    );
};

export default AdminPortal;
