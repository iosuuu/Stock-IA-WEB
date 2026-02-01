import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';
import { LayoutDashboard, Lock, User } from 'lucide-react';
import '../index.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === 'admin') {
                navigate('/portal');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px',
                borderRadius: '50%', background: 'var(--color-primary)', filter: 'blur(150px)', opacity: 0.2
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px',
                borderRadius: '50%', background: 'var(--color-accent)', filter: 'blur(150px)', opacity: 0.1
            }} />

            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px', zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%',
                        boxShadow: '0 0 20px var(--color-primary-glow)'
                    }}>
                        <LayoutDashboard size={40} color="var(--color-primary)" />
                    </div>
                </div>

                <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>TRACE IA</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Next-Gen Stock Intelligence</p>

                {error && <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <User size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Username"
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Access Portal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
