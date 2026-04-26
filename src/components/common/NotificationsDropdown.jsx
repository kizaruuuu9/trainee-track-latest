import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MoreHorizontal, Trash2, Check, Bell, Briefcase, FileText, Users, ExternalLink } from 'lucide-react';

const timeAgoShort = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return 'now';
    const now = new Date();
    const date = new Date(raw);
    if (!Number.isFinite(date.getTime())) return 'now';
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}y`;
};

const getIcon = (notif) => {
    const type = notif.type;
    const hasTarget = !!notif?.metadata?.target;
    
    if (hasTarget) return <ExternalLink size={18} color="#0a66c2" />;

    switch (type) {
        case 'job': return <Briefcase size={18} color="#0a66c2" />;
        case 'application': return <FileText size={18} color="#057642" />;
        case 'view': return <Users size={18} color="#7c3aed" />;
        default: return <Bell size={18} color="#0a66c2" />;
    }
};

const NotificationsDropdown = ({ onClose }) => {
    const navigate = useNavigate();
    const { userRole, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useApp();
    const [visibleCount, setVisibleCount] = useState(10);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [activeTab, setActiveTab] = useState('All');

    const filteredNotifications = notifications?.filter(n => {
        if (activeTab === 'Unread') return !n.read;
        return true;
    }) || [];

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const handleNotificationClick = (notif) => {
        // Mark as read if unread
        if (!notif.read) {
            markNotificationRead(notif.id);
        }

        // Handle redirection if metadata target exists
        if (notif.metadata?.target) {
            console.log('[Notifications] Redirecting Admin to:', notif.metadata.target);
            navigate(notif.metadata.target);
            if (onClose) onClose();
        }
    };

    return (
        <div 
            className="absolute right-0 top-12 md:right-[-60px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-[350px] md:w-[400px] flex flex-col overflow-hidden" 
            style={{ animation: 'fadeIn 0.2s ease-out', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex flex-col border-b border-slate-200 px-4 py-3 bg-white z-10 sticky top-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[16px] font-bold text-slate-900">Notifications</h2>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={markAllNotificationsRead}
                            disabled={unreadCount === 0}
                            className="text-[12px] font-semibold text-[#0a66c2] hover:bg-blue-50 px-2 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Mark all read
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('All')}
                        className={`px-3 py-1 rounded-full text-[13px] font-semibold transition-colors ${activeTab === 'All' ? 'bg-[#057642] text-white' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('Unread')}
                        className={`px-3 py-1 rounded-full text-[13px] font-semibold transition-colors ${activeTab === 'Unread' ? 'bg-[#057642] text-white' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '400px' }}>
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                        <Bell size={40} className="text-slate-300 mb-3" />
                        <h3 className="text-[15px] font-semibold text-slate-700">No new notifications</h3>
                        <p className="text-[13px] text-slate-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.slice(0, visibleCount).map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex p-3 gap-3 border-b border-slate-100 transition-colors relative group ${notif.read ? 'bg-white hover:bg-slate-50' : 'bg-[#f0f7ff] hover:bg-[#e6f0fa] cursor-pointer'}`}
                        >
                            {!notif.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0a66c2]" />
                            )}

                            {/* Avatar/Icon */}
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm relative mt-0.5">
                                {getIcon(notif)}
                                {!notif.read && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0a66c2] rounded-full border-2 border-white" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col justify-start">
                                <div className={`text-[13px] text-slate-900 leading-snug line-clamp-3 pr-2 ${notif.read ? 'font-normal' : 'font-semibold'}`}>
                                    {notif.text}
                                </div>
                                <span className={`text-[11px] mt-1 ${notif.read ? 'text-slate-500' : 'text-[#0a66c2] font-semibold'}`}>
                                    {timeAgoShort(notif.created_at)}
                                </span>
                            </div>

                            {/* Right Actions Menu */}
                            <div className="relative flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === notif.id ? null : notif.id);
                                    }}
                                    className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                
                                {menuOpenId === notif.id && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-[60] w-[140px]"
                                        style={{ animation: 'scaleIn 0.1s ease-out' }}
                                    >
                                        {!notif.read && (
                                            <button 
                                                onClick={() => { markNotificationRead(notif.id); setMenuOpenId(null); }}
                                                className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <Check size={14} /> Mark read
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => { deleteNotification(notif.id); setMenuOpenId(null); }}
                                            className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Footer Controls */}
                {filteredNotifications.length > 0 && (
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center sticky bottom-0">
                        {filteredNotifications.length > visibleCount ? (
                            <button
                                onClick={() => setVisibleCount(prev => prev + 10)}
                                className="text-[13px] font-semibold text-[#0a66c2] hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                            >
                                Load more...
                            </button>
                        ) : (
                            <span className="text-[12px] text-slate-400">End of notifications</span>
                        )}
                        <button
                            onClick={clearAllNotifications}
                            className="text-[13px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Global "View All" Link for Trainees */}
                {notifications?.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-white text-center">
                        <button 
                            onClick={() => {
                                if (userRole === 'trainee') {
                                    navigate('/trainee/notifications');
                                }
                                if (onClose) onClose();
                            }}
                            className={`text-[13px] font-bold text-[#0a66c2] hover:underline ${userRole !== 'trainee' ? 'opacity-50 cursor-default no-underline' : ''}`}
                            disabled={userRole !== 'trainee'}
                        >
                            {userRole === 'trainee' ? 'See all notifications' : 'View notifications above'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsDropdown;
