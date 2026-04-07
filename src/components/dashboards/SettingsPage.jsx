import React, { useState } from 'react';
import { Moon, Sun, Key, Trash2, Bell, Eye, Download, AlertTriangle, CheckCircle, ChevronRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SettingsPage = () => {
    const {
        currentUser,
        userRole,
        isDarkMode,
        toggleDarkMode,
        resetPassword,
        exportMyData,
        deleteMyAccount,
        updateTrainee,
        updatePartner
    } = useApp();

    const [resetStatus, setResetStatus] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Derive initial preference states (fallback to true if undefined)
    const isEmailEnabled = currentUser?.preferences?.emailNotifications !== false;
    const isInAppEnabled = currentUser?.preferences?.inAppNotifications !== false;
    const isProfilePublic = currentUser?.preferences?.profileVisibility !== false;

    const handlePreferenceChange = async (key, value) => {
        const updatedPreferences = { ...(currentUser?.preferences || {}), [key]: value };
        if (userRole === 'trainee') {
            await updateTrainee(currentUser.id, { preferences: updatedPreferences });
        } else if (userRole === 'partner') {
            await updatePartner(currentUser.id, { preferences: updatedPreferences });
        }
    };

    const handleResetPassword = async () => {
        setResetLoading(true);
        setResetStatus(null);
        const result = await resetPassword();
        setResetStatus(result.success ? 'success' : 'error');
        setResetLoading(false);
        setTimeout(() => setResetStatus(null), 5000);
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        await deleteMyAccount();
    };

    // Reusable minimalist toggle switch
    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={onChange}
            style={{
                width: 44, height: 24, borderRadius: 12,
                border: `2px solid ${checked ? '#0a66c2' : '#65676b'}`,
                background: checked ? '#0a66c2' : 'transparent',
                position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
        >
            <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: checked ? '#fff' : '#65676b',
                position: 'absolute', top: 3, left: checked ? 23 : 3,
                transition: 'all 0.2s ease'
            }} />
        </button>
    );

    // Reusable list item row
    const SettingRow = ({ icon: Icon, title, description, action, hideBorder }) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderBottom: hideBorder ? 'none' : '1px solid #e4e6eb'
        }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ color: '#65676b', display: 'flex', alignItems: 'center' }}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1e21' }}>{title}</div>
                    <div style={{ fontSize: 14, color: '#65676b', marginTop: 2 }}>{description}</div>
                </div>
            </div>
            <div>{action}</div>
        </div>
    );

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
            <div className="ln-card" style={{ padding: 0, overflow: 'hidden', marginTop: 20 }}>

                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #e4e6eb' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1c1e21', margin: 0 }}>Settings & Privacy</h2>
                    <p style={{ fontSize: 14, color: '#65676b', margin: '4px 0 0' }}>Manage your account preferences, notifications, and security.</p>
                </div>

                {/* Section: Appearance */}
                <div style={{ background: '#f9fafb', padding: '8px 24px', borderBottom: '1px solid #e4e6eb', fontSize: 14, fontWeight: 600, color: '#65676b' }}>
                    Account preferences
                </div>
                <SettingRow
                    icon={isDarkMode ? Moon : Sun}
                    title="Dark Mode"
                    description="Toggle dark theme across the application."
                    action={<Toggle checked={isDarkMode} onChange={toggleDarkMode} />}
                />

                {/* Section: Visibility */}
                <div style={{ background: '#f9fafb', padding: '8px 24px', borderBottom: '1px solid #e4e6eb', fontSize: 14, fontWeight: 600, color: '#65676b' }}>
                    Visibility
                </div>
                <SettingRow
                    icon={Eye}
                    title="Profile Visibility"
                    description="Allow others to see your profile and activity."
                    action={<Toggle checked={isProfilePublic} onChange={() => handlePreferenceChange('profileVisibility', !isProfilePublic)} />}
                />

                {/* Section: Communications */}
                <div style={{ background: '#f9fafb', padding: '8px 24px', borderBottom: '1px solid #e4e6eb', fontSize: 14, fontWeight: 600, color: '#65676b' }}>
                    Communications
                </div>
                <SettingRow
                    icon={Bell}
                    title="Email Notifications"
                    description="Receive important alerts directly to your email."
                    action={<Toggle checked={isEmailEnabled} onChange={() => handlePreferenceChange('emailNotifications', !isEmailEnabled)} />}
                />
                <SettingRow
                    icon={Bell}
                    title="In-App Notifications"
                    description="Receive alerts inside the dashboard."
                    action={<Toggle checked={isInAppEnabled} onChange={() => handlePreferenceChange('inAppNotifications', !isInAppEnabled)} />}
                />

                {/* Section: Data Privacy */}
                <div style={{ background: '#f9fafb', padding: '8px 24px', borderBottom: '1px solid #e4e6eb', fontSize: 14, fontWeight: 600, color: '#65676b' }}>
                    Data privacy
                </div>
                <SettingRow
                    icon={Download}
                    title="Download your data"
                    description="Export a complete JSON copy of your account data."
                    action={
                        <button className="ln-btn-outline" onClick={exportMyData} style={{ padding: '6px 16px', fontSize: 14, fontWeight: 600, borderRadius: 16 }}>
                            Request archive
                        </button>
                    }
                />

                {/* Section: Security */}
                <div style={{ background: '#f9fafb', padding: '8px 24px', borderBottom: '1px solid #e4e6eb', fontSize: 14, fontWeight: 600, color: '#65676b' }}>
                    Sign in & security
                </div>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e4e6eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ color: '#65676b', display: 'flex', alignItems: 'center' }}><Key size={24} strokeWidth={1.5} /></div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1e21' }}>Change password</div>
                                <div style={{ fontSize: 14, color: '#65676b', marginTop: 2 }}>Send a password reset link to your registered email.</div>
                            </div>
                        </div>
                        <button
                            className="ln-btn-outline"
                            onClick={handleResetPassword}
                            disabled={resetLoading}
                            style={{ padding: '6px 16px', fontSize: 14, fontWeight: 600, borderRadius: 16 }}
                        >
                            {resetLoading ? 'Sending...' : 'Send link'}
                        </button>
                    </div>
                    {resetStatus === 'success' && (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#e6f4ea', color: '#137333', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={16} /> Reset link sent successfully. Please check your inbox.
                        </div>
                    )}
                    {resetStatus === 'error' && (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#fce8e6', color: '#c5221f', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} /> Failed to send reset link. Please try again.
                        </div>
                    )}
                </div>

                {/* Delete Account Section */}
                <div style={{ padding: '16px 24px' }}>
                    {!showDeleteConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ color: '#65676b', display: 'flex', alignItems: 'center' }}><Trash2 size={24} strokeWidth={1.5} /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1e21' }}>Close account</div>
                                    <div style={{ fontSize: 14, color: '#65676b', marginTop: 2 }}>Permanently remove your account and all associated data.</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{ background: 'none', border: 'none', color: '#65676b', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 16px' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Close account
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#fce8e6', borderRadius: 8, padding: 20, border: '1px solid #fad2cf' }}>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <AlertTriangle size={20} color="#c5221f" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 16, color: '#c5221f' }}>Are you absolutely sure?</div>
                                    <p style={{ fontSize: 14, color: '#1c1e21', marginTop: 8, lineHeight: 1.5 }}>
                                        This action cannot be undone. This will permanently delete your account, remove your profile from our servers, and sever all active applications or postings.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button
                                    className="ln-btn-outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                    style={{ background: '#fff', padding: '6px 16px', borderRadius: 16, fontSize: 14 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="ln-btn-primary"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                    style={{ background: '#c5221f', border: 'none', padding: '6px 16px', borderRadius: 16, fontSize: 14 }}
                                >
                                    {deleteLoading ? 'Closing...' : 'Close account'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SettingsPage;