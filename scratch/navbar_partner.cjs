const fs = require('fs');

const path = 'src/components/dashboards/PartnerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement code:
const partnerSideNav = `// ─── LEFT NAVIGATION BAR ─────────────
const PartnerSideNav = ({ activePage, setActivePage }) => {
    const { currentUser, partners, logout, notifications, markNotificationRead } = useApp();
    const navigate = useNavigate();
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    
    // Partner-specific data
    const livePartner = getLivePartner(currentUser, partners);
    const verified = isVerified(livePartner);
    const initials = livePartner?.companyName?.charAt(0)?.toUpperCase() || 'P';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={18} /> },
        { id: 'profile', label: 'Company', icon: <Building2 size={18} /> },
        { id: 'verification', label: 'Verification', icon: <ShieldCheck size={18} /> },
        { id: 'post-job', label: 'Post Opportunities', icon: <Plus size={18} />, locked: !verified },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} />, locked: !verified },
        { id: 'applicants', label: 'Recruit', icon: <Users size={18} />, locked: !verified },
    ];

    return (
        <aside className="tt-sidenav">
            {/* Logo */}
            <div className="tt-sidenav-logo">
                <BrandLogo size={28} fallbackClassName="tt-logo-icon" />
                <span className="tt-sidenav-brand">TraineeTrack</span>
            </div>

            {/* Profile mini card */}
            <div
                className="tt-sidenav-profile"
                onClick={() => setActivePage('profile')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActivePage('profile')}
            >
                <div className="tt-sidenav-avatar">
                    {livePartner?.company_logo_url || livePartner?.photo
                        ? <img src={livePartner.company_logo_url || livePartner.photo} alt={livePartner?.companyName || 'Profile'} />
                        : initials
                    }
                </div>
                <div className="tt-sidenav-profile-info">
                    <div className="tt-sidenav-profile-name">{livePartner?.companyName || 'Partner'}</div>
                    <div className="tt-sidenav-profile-role">Industry Partner</div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </div>

            {/* Nav Items */}
            <div className="tt-sidenav-section-label">Navigation</div>
            <nav className="tt-sidenav-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={\`tt-sidenav-item \${activePage === item.id ? 'active' : ''}\`}
                        onClick={() => {
                            if (item.locked && !verified) {
                                if (window.confirm("Verification Required. Go to Verification page?")) {
                                    setActivePage('verification');
                                }
                            } else {
                                setActivePage(item.id);
                            }
                        }}
                        title={item.label}
                    >
                        <span className={\`tt-sidenav-item-icon \${item.locked ? 'text-gray-400' : ''}\`}>
                            {item.locked ? <Lock size={18} /> : item.icon}
                        </span>
                        <span className={\`tt-sidenav-item-label \${item.locked ? 'text-gray-400 opacity-60' : ''}\`}>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom: notifications, settings, logout */}
            <div className="tt-sidenav-bottom">
                {/* Notifications */}
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
                        {notifications?.length === 0 ? (
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
                {/* Settings */}
                <button className="tt-sidenav-item" onClick={() => setActivePage('settings')} title="Settings">
                    <span className="tt-sidenav-item-icon"><Settings size={18} /></span>
                    <span className="tt-sidenav-item-label">Settings</span>
                </button>
                {/* Logout */}
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

const partnerLayout = `const PartnerLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app">
        <PartnerSideNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);`;

// 1. the existing TopNav and Layout
const i1 = content.indexOf("const PartnerTopNav = ({ activePage, setActivePage }) => {");
const i2 = content.indexOf("// ─── LEFT: COMPANY PROFILE CARD ──────────────────────────────────");

content = content.substring(0, i1) + partnerSideNav + "\n\n// ─── LAYOUT WRAPPER ──────────────────────────────────────────────\n" + partnerLayout + "\n\n" + content.substring(i2);

fs.writeFileSync(path, content, 'utf8');
console.log("Navbar written successfully!");
