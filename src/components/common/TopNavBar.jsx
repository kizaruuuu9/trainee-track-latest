import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import { Search, Menu, Bell, Settings, LogOut, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks';

import NotificationsDropdown from './NotificationsDropdown';

const TopNavBar = ({ activePage, setActivePage }) => {
    const { logout, lastSeenNotificationsAt, updateLastSeenNotificationsAt } = useApp();
    const { data: notifications = [] } = useNotifications();

    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    const unreadNotifications = notifications?.filter(n => !n.read) || [];
    
    // The badge reflects ONLY notifications that are unread AND newer than the user's last_seen timestamp
    const unseenCount = lastSeenNotificationsAt 
        ? unreadNotifications.filter(n => new Date(n.created_at).getTime() > lastSeenNotificationsAt).length
        : unreadNotifications.length;

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (page) => {
        if (setActivePage) setActivePage(page);
        setMenuOpen(false);
        setNotificationsOpen(false);
    };

    return (
        <header className="tt-topbar">
            <div className="tt-topbar-brand">
                <BrandLogo size={28} fallbackClassName="tt-logo-icon" />
                <span className="tt-topbar-title">TraineeTrack</span>
            </div>

            <div className="tt-topbar-right">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Notification Button & Dropdown */}
                    <div className="tt-hamburger-container" ref={notifRef}>
                        <button 
                            className="tt-hamburger-btn" 
                            onClick={() => {
                                setNotificationsOpen(!notificationsOpen);
                                setMenuOpen(false); // Close other menu
                                // Globally sync that the user has seen their notifications board
                                if (!notificationsOpen && unseenCount > 0) {
                                    updateLastSeenNotificationsAt();
                                }
                            }}
                            title="Notifications"
                        >
                            <Bell size={24} color="white" />
                            {unseenCount > 0 && <span className="tt-hamburger-badge">{unseenCount > 99 ? '99+' : unseenCount}</span>}
                        </button>

                        {notificationsOpen && (
                            <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
                        )}
                    </div>

                    {/* Main Menu Container */}
                    <div className="tt-hamburger-container" ref={dropdownRef}>
                        <button 
                            className="tt-hamburger-btn" 
                            onClick={() => {
                                setMenuOpen(!menuOpen);
                                setNotificationsOpen(false); // Close other menu
                            }}
                            title="Menu"
                        >
                            <Menu size={24} color="white" />
                        </button>

                        {menuOpen && (
                            <div className="tt-hamburger-dropdown">
                                <button className="tt-dropdown-item tt-mobile-profile-item" onClick={() => handleNavigate('profile')}>
                                    <User size={18} />
                                    <span>Profile</span>
                                </button>
                                <div className="tt-dropdown-divider tt-mobile-profile-item" />
                                <button className="tt-dropdown-item" onClick={() => handleNavigate('settings')}>
                                    <Settings size={18} />
                                    <span>Settings</span>
                                </button>
                                <div className="tt-dropdown-divider" />
                                <button className="tt-dropdown-item tt-dropdown-danger" onClick={() => { setMenuOpen(false); logout(); }}>
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNavBar;
