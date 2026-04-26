import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, AlertCircle, Info } from 'lucide-react';

const GlobalConfirmModal = () => {
    const { globalConfirm, closeGlobalConfirm } = useApp();

    if (!globalConfirm || !globalConfirm.isOpen) return null;

    const { title, message, onConfirm, confirmText, cancelText, type } = globalConfirm;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger': return { icon: <Trash2 size={24} color="#dc2626" />, bg: '#fef2f2', btn: '#dc2626' };
            case 'warning': return { icon: <AlertCircle size={24} color="#d97706" />, bg: '#fff7ed', btn: '#d97706' };
            case 'primary': return { icon: <Info size={24} color="#0a66c2" />, bg: '#eff6ff', btn: '#0a66c2' };
            default: return { icon: <Info size={24} color="#0a66c2" />, bg: '#eff6ff', btn: '#0a66c2' };
        }
    };

    const styles = getTypeStyles();

    return (
        <div 
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16
            }} 
            onClick={closeGlobalConfirm}
        >
            <div 
                style={{
                    background: 'white', borderRadius: 20, padding: '32px 24px', 
                    minWidth: 320, maxWidth: 420, width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                    textAlign: 'center', position: 'relative',
                    animation: 'confirm-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={closeGlobalConfirm}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', padding: 4, borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: styles.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 20px',
                }}>
                    {styles.icon}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                    {title}
                </h3>
                
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 28px' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                        onClick={closeGlobalConfirm}
                        style={{
                            flex: 1, padding: '12px 16px', borderRadius: 12, 
                            border: '1px solid #e2e8f0', background: 'white', 
                            color: '#475569', fontSize: 14, fontWeight: 600, 
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px 16px', borderRadius: 12, 
                            border: 'none', background: styles.btn, 
                            color: 'white', fontSize: 14, fontWeight: 600, 
                            cursor: 'pointer', boxShadow: `0 4px 12px ${styles.btn}40`,
                            transition: 'all 0.2s'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>

                <style>{`
                    @keyframes confirm-in {
                        from { transform: scale(0.9); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default GlobalConfirmModal;
