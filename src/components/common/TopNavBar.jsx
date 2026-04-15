import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import { Search, Menu, Bell, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const TopNavBar = ({ activePage, setActivePage }) => {
    const { logout, notifications } = useApp();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (page) => {
        if (setActivePage) setActivePage(page);
        setMenuOpen(false);
    };

    return (
        <header className="tt-topbar">
            <div className="tt-topbar-brand">
                <BrandLogo size={28} fallbackClassName="tt-logo-icon" />
                <span className="tt-topbar-title">TraineeTrack</span>
            </div>
            
            <div className="tt-topbar-search-container">
                <div className="tt-topbar-search">
                    <Search size={18} className="tt-topbar-search-icon" color="#64748b" />
                    <input type="text" placeholder="Search..." />
                </div>
            </div>

            <div className="tt-topbar-right">
                <div className="tt-hamburger-container" ref={dropdownRef}>
                    <button 
                        className="tt-hamburger-btn" 
                        onClick={() => setMenuOpen(!menuOpen)}
                        title="Menu"
                    >
                        <Menu size={24} color="white" />
                        {unreadCount > 0 && <span className="tt-hamburger-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    {menuOpen && (
                        <div className="tt-hamburger-dropdown">
                            <button className="tt-dropdown-item" onClick={() => handleNavigate('notifications')}>
                                <Bell size={18} />
                                <span>Notifications</span>
                                {unreadCount > 0 && <span className="tt-dropdown-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>
                            <button className="tt-dropdown-item" onClick={() => handleNavigate('settings')}>
                                <Settings size={18} />
                                <span>Settings</span>
                            </button>
                            <div className="tt-dropdown-divider" />
                            <button className="tt-dropdown-item tt-dropdown-danger" onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}>
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavBar;
