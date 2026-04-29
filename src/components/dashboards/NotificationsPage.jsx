import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, Trash2, MoreVertical, Briefcase, FileText, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const timeAgo = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return 'Just now';
    const now = new Date();
    const date = new Date(raw);
    if (!Number.isFinite(date.getTime())) return 'Just now';
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
};

const NotificationsPage = () => {
    const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useApp();
    const [activeTab, setActiveTab] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const navigate = useNavigate();

    const filtered = (notifications || []).filter(n => {
        if (activeTab === 'Unread' && n.read) return false;

        if (timeFilter !== 'All') {
            const notifDate = new Date(n.created_at);
            const now = new Date();
            const diffMs = now - notifDate;

            if (timeFilter === 'Hour' && diffMs > 60 * 60 * 1000) return false;
            if (timeFilter === 'Day' && diffMs > 24 * 60 * 60 * 1000) return false;
            if (timeFilter === 'Week' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
            if (timeFilter === 'Month' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
        }

        return true;
    });

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const getIcon = (notif) => {
        const type = notif.type;
        switch (type) {
            case 'job': return <Briefcase size={20} className="text-blue-600" />;
            case 'application': return <FileText size={20} className="text-green-600" />;
            case 'view': return <Users size={20} className="text-purple-600" />;
            default: return <Bell size={20} className="text-blue-500" />;
        }
    };

    const handleAction = (notif) => {
        if (!notif.read) markNotificationRead(notif.id);
        if (notif.metadata?.target) {
            navigate(notif.metadata.target);
        }
    };

    return (
        <div className="notifications-page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
            <div className="ln-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h2>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                            className="ln-btn-outline" 
                            style={{ fontSize: 13, padding: '6px 12px', borderRadius: 20 }}
                            onClick={markAllNotificationsRead}
                            disabled={unreadCount === 0}
                        >
                            Mark all as read
                        </button>
                        <button 
                            className="ln-btn-outline" 
                            style={{ fontSize: 13, padding: '6px 12px', borderRadius: 20, color: '#dc2626', borderColor: '#fecaca' }}
                            onClick={clearAllNotifications}
                            disabled={notifications.length === 0}
                        >
                            Clear all
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <button 
                        onClick={() => setActiveTab('All')}
                        style={{ 
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                            background: activeTab === 'All' ? '#057642' : 'transparent',
                            color: activeTab === 'All' ? '#fff' : '#64748b',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setActiveTab('Unread')}
                        style={{ 
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                            background: activeTab === 'Unread' ? '#057642' : 'transparent',
                            color: activeTab === 'Unread' ? '#fff' : '#64748b',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount > 99 ? '99+' : unreadCount})`}
                    </button>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        <select 
                            style={{ fontSize: 13, padding: '6px 12px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#fff', outline: 'none', cursor: 'pointer', color: '#475569' }}
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                        >
                            <option value="All">Any time</option>
                            <option value="Hour">Past hour</option>
                            <option value="Day">Past 24 hours</option>
                            <option value="Week">Past week</option>
                            <option value="Month">Past month</option>
                        </select>
                    </div>
                </div>

                <div className="notifications-list">
                    {filtered.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Bell size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#475569' }}>No notifications yet</h3>
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>We'll notify you when something important happens.</p>
                        </div>
                    ) : (
                        filtered.map(notif => (
                            <div 
                                key={notif.id}
                                onClick={() => handleAction(notif)}
                                style={{ 
                                    padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16,
                                    background: notif.read ? '#fff' : '#f0f7ff',
                                    cursor: 'pointer', transition: 'background 0.2s',
                                    position: 'relative'
                                }}
                                className="notification-item-hover"
                            >
                                {!notif.read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#0a66c2' }} />}
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    {getIcon(notif)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.5, marginBottom: 4, fontWeight: notif.read ? 400 : 600 }}>
                                        {notif.text}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: notif.read ? '#64748b' : '#0a66c2', fontWeight: notif.read ? 400 : 600 }}>{timeAgo(notif.created_at)}</span>
                                        {notif.metadata?.target && <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={10} /> View details</span>}
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === notif.id ? null : notif.id); }}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {menuOpenId === notif.id && (
                                        <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: 140, padding: '4px 0' }}>
                                            {!notif.read && (
                                                <button 
                                                    onClick={() => { markNotificationRead(notif.id); setMenuOpenId(null); }}
                                                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}
                                                >
                                                    <Check size={14} /> Mark as read
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => { deleteNotification(notif.id); setMenuOpenId(null); }}
                                                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
