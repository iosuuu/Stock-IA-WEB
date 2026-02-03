import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Cpu, Loader } from 'lucide-react';
import { authHeader } from '../auth';
import { useLanguage } from '../contexts/LanguageContext';

const Trace = () => {
    const { t } = useLanguage();
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResults(null);
        setSuccessMessage('');
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setAnalyzing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3001/api/analyze', {
                method: 'POST',
                headers: { ...authHeader() },
                body: formData
            });
            const data = await response.json();
            setResults(data.items);
        } catch (error) {
            console.error(error);
            alert(t('analysisFailed'));
        } finally {
            setAnalyzing(false);
        }
    };

    const confirmUpdate = async () => {
        if (!results) return;
        try {
            await fetch('http://localhost:3001/api/analyze/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ items: results })
            });
            setSuccessMessage(t('stockUpdated'));
            setResults(null);
            setFile(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Cpu style={{ marginRight: '10px', color: 'var(--color-accent)' }} />
                {t('aiAnalysisCenter')}
            </h1>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                {!results && !successMessage && (
                    <>
                        <div style={{
                            border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-lg)',
                            padding: '3rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                        }}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                            <UploadCloud size={64} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ margin: 0 }}>
                                {file ? file.name : t('dropFile')}
                            </h3>
                            <p style={{ color: 'var(--color-text-muted)' }}>{t('supportedFormats')}</p>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem', width: '200px', fontSize: '1.1rem' }}
                            onClick={handleAnalyze}
                            disabled={!file || analyzing}
                        >
                            {analyzing ? <><Loader className="spin" size={20} /> {t('analyzing')}</> : t('analyzeAi')}
                        </button>
                    </>
                )}

                {analyzing && (
                    <div style={{ marginTop: '2rem' }}>
                        <p className="pulse">{t('processing')}</p>
                        <p className="pulse" style={{ animationDelay: '0.5s' }}>{t('extracting')}</p>
                    </div>
                )}

                {results && (
                    <div>
                        <h2 style={{ color: 'var(--color-accent)' }}>{t('analysisComplete')}</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>{t('aiIdentified')}</p>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '2rem 0' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>{t('sku')}</th>
                                        <th style={{ padding: '1rem' }}>{t('description')}</th>
                                        <th style={{ padding: '1rem' }}>{t('supplier')}</th>
                                        <th style={{ padding: '1rem' }}>{t('location')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>{t('quantity')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.sku}</td>
                                            <td style={{ padding: '1rem' }}>{item.description}</td>
                                            <td style={{ padding: '1rem' }}>{item.supplier}</td>
                                            <td style={{ padding: '1rem' }}>{item.location}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-accent)', fontWeight: 'bold', textAlign: 'right' }}>+{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setResults(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={confirmUpdate}>{t('confirmUpdate')}</button>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div style={{ padding: '2rem' }}>
                        <CheckCircle size={64} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
                        <h2>{successMessage}</h2>
                        <button className="btn btn-primary" onClick={() => { setSuccessMessage(''); setFile(null); }}>{t('analyzeAnother')}</button>
                    </div>
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; margin-right: 8px; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .pulse { animation: pulse 1.5s infinite; opacity: 0.5; }
                @keyframes pulse { 50% { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default Trace;
