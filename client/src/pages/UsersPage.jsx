import React, { useState, useEffect } from 'react';
import { Users, Trash2, Plus } from 'lucide-react';
import { authHeader } from '../auth';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // New User State
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'worker', full_name: '', department: ''
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/users', { headers: authHeader() });
            const data = await res.json();
            setUsers(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        await fetch(`http://localhost:3001/api/users/${id}`, {
            method: 'DELETE', headers: authHeader()
        });
        fetchUsers();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify(formData)
        });
        setShowForm(false);
        setFormData({ username: '', password: '', role: 'worker', full_name: '', department: '' });
        fetchUsers();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>User Management</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add User</button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Department</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{u.username}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                                        color: u.role === 'admin' ? '#93c5fd' : '#cbd5e1'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{u.full_name}</td>
                                <td style={{ padding: '1rem' }}>{u.department}</td>
                                <td style={{ padding: '1rem' }}>
                                    {u.username !== 'admin' && (
                                        <button className="btn" style={{ padding: '0.5rem', color: 'var(--color-danger)' }} onClick={() => handleDelete(u.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '2rem', background: '#1e293b' }}>
                        <h2 style={{ marginTop: 0 }}>Create User</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                                <input className="input-field" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                                <input className="input-field" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Role</label>
                                <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="worker">Worker</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
                                <input className="input-field" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Department</label>
                                <input className="input-field" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
