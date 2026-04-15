const fs = require('fs');

const path = 'c:/Users/admin/Downloads/CAPSTONE/TraineeTrackV2/trainee-track-v2/src/components/dashboards/TraineeDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const traineeSideNav = `// ─── LEFT NAVIGATION BAR ─────────────
const TraineeSideNav = ({ activePage, setActivePage }) => {
    const { currentUser, logout, notifications, markNotificationRead } = useApp();
    const navigate = useNavigate();
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    
    // Trainee-specific data
    const initials = (currentUser?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={18} /> },
        { id: 'profile', label: 'Profile', icon: <User size={18} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={18} /> },
        { id: 'applications', label: 'My Applications', icon: <FileText size={18} /> },
    ];

    return (
        <aside className="tt-sidenav">
            <div className="tt-sidenav-logo">
                <BrandLogo size={28} fallbackClassName="tt-logo-icon" />
                <span className="tt-sidenav-brand">TraineeTrack</span>
            </div>

            <div
                className="tt-sidenav-profile"
                onClick={() => setActivePage('profile')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActivePage('profile')}
            >
                <div className="tt-sidenav-avatar">
                    {currentUser?.photo
                        ? <img src={currentUser.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt={currentUser?.name || 'Profile'} />
                        : initials
                    }
                </div>
                <div className="tt-sidenav-profile-info">
                    <div className="tt-sidenav-profile-name">{currentUser?.name || 'Trainee'}</div>
                    <div className="tt-sidenav-profile-role">TESDA Trainee</div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </div>

            <div className="tt-sidenav-section-label">Navigation</div>
            <nav className="tt-sidenav-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={\`tt-sidenav-item \${activePage === item.id ? 'active' : ''}\`}
                        onClick={() => setActivePage(item.id)}
                        title={item.label}
                    >
                        <span className="tt-sidenav-item-icon">
                            {item.icon}
                        </span>
                        <span className="tt-sidenav-item-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="tt-sidenav-bottom">
                <button
                    className={\`tt-sidenav-item \${showNotifPanel ? 'active' : ''}\`}
                    onClick={() => setShowNotifPanel(v => !v)}
                    title="Notifications"
                >
                    <span className="tt-sidenav-item-icon">
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="tt-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </span>
                    <span className="tt-sidenav-item-label">Notifications</span>
                </button>
                {showNotifPanel && (
                    <div className="tt-sidenav-notif-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>Notifications</span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{unreadCount} unread</span>
                        </div>
                        {(!notifications || notifications.length === 0) ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No new notifications</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                                {notifications?.map(n => (
                                    <div key={n.id} onClick={() => { markNotificationRead(n.id); setShowNotifPanel(false); if (n.link_path) { navigate(n.link_path); } }} style={{ padding: 10, background: n.read ? '#f8fafc' : '#eff6ff', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            {n.read ? <Check size={14} color="#64748b" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{n.title}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <button className="tt-sidenav-item" onClick={() => setActivePage('settings')} title="Settings">
                    <span className="tt-sidenav-item-icon"><Settings size={18} /></span>
                    <span className="tt-sidenav-item-label">Settings</span>
                </button>
                <button
                    className="tt-sidenav-item"
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    style={{ color: '#ef4444' }}
                    title="Sign Out"
                >
                    <span className="tt-sidenav-item-icon" style={{ color: 'inherit' }}><LogOut size={18} /></span>
                    <span className="tt-sidenav-item-label">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};`;

const traineeLayout = `const TraineeLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app">
        <TraineeSideNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);`;

if (!content.includes(' Check,')) {
    content = content.replace(/(from 'lucide-react';)/, "Check, $1");
    // Just a rough hack, let's do an exact replacement on the import block:
    if (content.includes('CheckSquare,')) {
        content = content.replace('CheckSquare,', 'CheckSquare, Check,');
    }
}

const i1 = content.indexOf("const LinkedInTopNav = ({ activePage, setActivePage }) => {");
const i2 = content.indexOf("// ─── LEFT PROFILE CARD (LinkedIn-style) ──────────────────────────");

if (i1 === -1 || i2 === -1) {
    console.error("Could not find the target code boundaries inside TraineeDashboard.jsx");
    process.exit(1);
}

content = content.substring(0, i1) + traineeSideNav + "\n\n// ─── LAYOUT WRAPPER ──────────────────────────────────────────────\n" + traineeLayout + "\n\n" + content.substring(i2);
content = content.replace(/<LinkedInLayout/g, "<TraineeLayout");
content = content.replace(/<\/LinkedInLayout>/g, "</TraineeLayout>");

fs.writeFileSync(path, content, 'utf8');
console.log("Navbar written successfully for TraineeDashboard!");
