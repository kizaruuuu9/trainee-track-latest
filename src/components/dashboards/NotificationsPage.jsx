import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MoreHorizontal, Trash2, Check, Bell, Briefcase, FileText, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Time formatting helper
export const timeAgoShort = (dateStr) => {
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

const NotificationsPage = () => {
    const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useApp();
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(10);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const menuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'job': return <Briefcase size={20} color="#0a66c2" />;
            case 'application': return <FileText size={20} color="#057642" />;
            case 'view': return <Users size={20} color="#7c3aed" />;
            default: return <Bell size={20} color="#0a66c2" />;
        }
    };

    const filteredNotifications = notifications?.filter(n => {
        if (activeTab === 'Unread') return !n.read;
        return true; // 'All'
    }) || [];

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return (
        <div className="flex justify-center gap-6 max-w-[1128px] mx-auto mt-6 px-4 pb-12" style={{ animation: 'fadeIn 0.3s ease-out' }}>

            {/* Left Sidebar */}
            <div className="hidden md:block w-[225px] flex-shrink-0">
                <div className="ln-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4">
                        <h2 className="text-[16px] font-semibold text-slate-900 mb-3">Manage your Notifications</h2>
                        <button
                            onClick={() => navigate('../settings')}
                            className="text-[14px] font-bold text-[#0a66c2] hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                            View Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 max-w-[744px]">
                <div className="ln-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                    {/* Tabs Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'All' ? 'bg-[#057642] text-white border border-[#057642]' : 'bg-transparent text-slate-600 border border-slate-500 hover:bg-slate-50 hover:border-slate-700 hover:text-slate-900'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab('Unread')}
                                className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'Unread' ? 'bg-[#057642] text-white border border-[#057642]' : 'bg-transparent text-slate-600 border border-slate-500 hover:bg-slate-50 hover:border-slate-700 hover:text-slate-900'
                                    }`}
                            >
                                Unread {unreadCount > 0 && `(${unreadCount})`}
                            </button>
                        </div>

                        <div className="flex gap-2 items-center">
                            <button
                                onClick={markAllNotificationsRead}
                                disabled={unreadCount === 0}
                                className="text-[13px] font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Mark all as read
                            </button>
                            <button
                                onClick={clearAllNotifications}
                                disabled={notifications?.length === 0}
                                className="text-[13px] font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex flex-col">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700">No new notifications</h3>
                                <p className="text-sm text-slate-500 mt-2">You're all caught up! Check back later for updates.</p>
                            </div>
                        ) : (
                            filteredNotifications.slice(0, visibleCount).map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => { if (!notif.read) markNotificationRead(notif.id); }}
                                    className={`flex p-4 gap-4 border-b border-slate-100 transition-colors relative ${notif.read ? 'bg-white' : 'bg-[#f0f7ff] hover:bg-[#e6f0fa] cursor-pointer'}`}
                                >
                                    {/* Unread Indicator */}
                                    {!notif.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0a66c2]" />
                                    )}

                                    {/* Avatar/Icon */}
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm relative">
                                        {getIcon(notif.type)}
                                        {!notif.read && (
                                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#0a66c2] rounded-full border-2 border-white" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-center pr-4">
                                        <div className={`text-[14px] text-slate-900 leading-snug ${notif.read ? 'font-normal' : 'font-semibold'}`}>
                                            {notif.text}
                                        </div>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0" ref={menuRef}>
                                        <span className={`text-[12px] ${notif.read ? 'text-slate-500' : 'text-[#0a66c2] font-semibold'}`}>
                                            {timeAgoShort(notif.created_at)}
                                        </span>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(menuOpenId === notif.id ? null : notif.id);
                                                }}
                                                className="text-slate-500 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>

                                            {menuOpenId === notif.id && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-48 py-1 overflow-hidden"
                                                >
                                                    {!notif.read && (
                                                        <button
                                                            onClick={() => { markNotificationRead(notif.id); setMenuOpenId(null); }}
                                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
                                                        >
                                                            <Check size={18} className="text-slate-500" /> Mark as read
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { deleteNotification(notif.id); setMenuOpenId(null); }}
                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
                                                    >
                                                        <Trash2 size={18} className="text-slate-500" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Load More */}
                    {filteredNotifications.length > visibleCount && (
                        <div className="p-4 text-center border-t border-slate-200">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 10)}
                                className="text-[14px] font-semibold text-slate-600 hover:bg-slate-100 px-6 py-2 rounded-md transition-colors"
                            >
                                Load more
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;