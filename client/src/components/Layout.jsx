import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // CORRECT IMPORTS
import { logout, getCurrentUser } from '../auth';
import {
    LayoutDashboard,
    AppWindow, // Replaces Layout
    Package,
    Users,
    LogOut,
    Menu,
    X,
    Cpu,
    BarChart3, // For Metrics
    History // For Activity
} from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Get selected company
    // Logic: If user is restricted (linked_company), force that company.
    // If Admin, use localStorage selection or null.

    // Mock Config for Logos (reuse from AdminPortal) - In real app, this should be in a shared config or Context
    const companyConfig = {
        'TechGiants Inc.': { logo: '⚡' },
        'Global Logistics': { logo: '🌍' },
        'AutoParts Prime': { logo: '🚗' },
        'Fresh Foods Ltd.': { logo: '🥦' },
    };

    let selectedCompany = null;
    if (user?.linked_company) {
        selectedCompany = {
            name: user.linked_company,
            logo: companyConfig[user.linked_company]?.logo || '🏢'
        };
    } else {
        selectedCompany = JSON.parse(localStorage.getItem('trace_current_company') || 'null');
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSwitchCompany = () => {
        localStorage.removeItem('trace_current_company');
        navigate('/portal');
    };

    const NavItem = ({ to, icon: Icon, label }) => { // Renamed prop 'icon' to 'Icon' (capitalized)
        const isActive = location.pathname === to;
        return (
            <div
                onClick={() => navigate(to)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    margin: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text-muted)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                className={isActive ? '' : 'nav-hover'}
            >
                {isActive && <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                }} />}
                <Icon size={20} style={{ marginRight: '0.75rem' }} /> {/* Used Icon as component */}
                <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{
                width: sidebarOpen ? '260px' : '0',
                background: 'var(--color-bg-paper)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: selectedCompany ? '0.5rem' : '0' }}>
                        <div style={{
                            background: 'var(--color-primary)', borderRadius: '8px', padding: '6px', marginRight: '10px',
                            boxShadow: '0 0 10px var(--color-primary-glow)'
                        }}>
                            <AppWindow size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px' }}>TRACE IA</h3>
                        </div>
                    </div>
                    {selectedCompany && (
                        <div style={{
                            fontSize: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '0.5rem'
                        }}>
                            <span style={{ marginRight: '6px' }}>{selectedCompany.logo}</span>
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                {selectedCompany.name}
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
                    <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
                    <NavItem to="/dashboard/metrics" icon={BarChart3} label="Analytics" />
                    <NavItem to="/dashboard/activity" icon={History} label="Activity History" />
                    <NavItem to="/dashboard/trace" icon={Cpu} label="Trace & Analyze" />
                    <NavItem to="/dashboard/stock" icon={Package} label="Stock Manager" />

                    {user?.role === 'admin' && (
                        <>
                            <div style={{ margin: '1rem 1.5rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Admin</div>
                            {/* Switch Company Button */}
                            <div
                                onClick={handleSwitchCompany}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    margin: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    color: 'var(--color-accent)',
                                    transition: 'all 0.2s',
                                    border: '1px dashed rgba(255,255,255,0.1)'
                                }}
                                className="nav-hover"
                            >
                                <Users size={20} style={{ marginRight: '0.75rem' }} />
                                <span style={{ fontWeight: 500 }}>Switch Company</span>
                            </div>
                            <NavItem to="/dashboard/users" icon={Users} label="User Management" />
                        </>
                    )}
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn"
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        <LogOut size={16} style={{ marginRight: '8px' }} />
                        Log Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>
                {/* Mobile Header logic could go here */}
                {/* Main Viewport */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                    {/* Toggle Sidebar Button (Floating) */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
                            background: 'var(--color-bg-paper)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--color-text)'
                        }}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
