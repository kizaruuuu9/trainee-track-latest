import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, MapPin, Mail, Globe, Briefcase, Award, BookOpen,
  GraduationCap, Star, User
} from 'lucide-react';

const Section = ({ icon, title, children }) => (
  <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 10 }}>
      {icon}{title}
    </div>
    {children}
  </div>
);

const TraineeReadOnlyView = ({ profile }) => {
  const name = profile.full_name || profile.profile_name || 'Trainee';
  const program = profile.programs?.name || null;
  const location = [profile.city, profile.province].filter(Boolean).join(', ') || profile.region || null;
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const certs = Array.isArray(profile.certifications) ? profile.certifications : [];
  const educHistory = Array.isArray(profile.educ_history) ? profile.educ_history : [];
  const workExp = Array.isArray(profile.work_experience) ? profile.work_experience : [];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const employmentLabel = (status) => {
    if (status === 'employed') return 'Employed';
    if (status === 'seeking_employment') return 'Seeking Employment';
    return 'Not Employed';
  };

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 44 }}>
        <div style={{ height: 84, background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', overflow: 'hidden' }}>
          {profile.banner_url && <img src={profile.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{
          position: 'absolute', bottom: -28, left: 20,
          width: 58, height: 58, borderRadius: '50%', border: '3px solid white',
          background: profile.profile_picture_url ? 'transparent' : 'linear-gradient(135deg, #ede9fe, #dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800,
          color: '#7c3aed', overflow: 'hidden', flexShrink: 0
        }}>
          {profile.profile_picture_url
            ? <img src={profile.profile_picture_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{name}</div>
        {program && <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>{program}</div>}
        {location && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 4 }}><MapPin size={12} /> {location}</div>}
        {profile.contact_email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 3 }}><Mail size={12} /> {profile.contact_email}</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span className="ln-badge ln-badge-blue">{profile.training_status === 'graduated' ? 'Graduated' : 'Student'}</span>
          {profile.employment_status && <span className={`ln-badge ${profile.employment_status === 'employed' ? 'ln-badge-green' : 'ln-badge-yellow'}`}>{employmentLabel(profile.employment_status)}</span>}
          {profile.graduation_year && <span className="ln-badge ln-badge-blue">Class of {profile.graduation_year}</span>}
        </div>
      </div>

      {skills.length > 0 && <Section icon={<Star size={14} />} title="Skills"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{skills.map(s => <span key={s} className="ln-cert-tag" style={{ fontSize: 12 }}>{s}</span>)}</div></Section>}

      {certs.length > 0 && (
        <Section icon={<Award size={14} />} title="Certifications">
          {certs.map((c, i) => {
            const isStr = typeof c === 'string';
            return (
              <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < certs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{isStr ? c : (c.name || c.certificationName || '—')}</div>
                {!isStr && c.issuingOrg && <div style={{ fontSize: 12, color: '#64748b' }}>{c.issuingOrg}</div>}
                {!isStr && (c.issueDate || c.expirationDate) && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{c.issueDate}{c.issueDate && (c.expirationDate || c.noExpiry) ? ' – ' : ''}{c.noExpiry ? 'No Expiry' : c.expirationDate}</div>}
              </div>
            );
          })}
        </Section>
      )}

      {educHistory.length > 0 && (
        <Section icon={<GraduationCap size={14} />} title="Education">
          {educHistory.map((e, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < educHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{e.school || '—'}</div>
              {e.degree && <div style={{ fontSize: 12, color: '#64748b' }}>{e.degree}</div>}
              {(e.yearFrom || e.yearTo) && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{e.yearFrom} – {e.yearTo || 'Present'}</div>}
            </div>
          ))}
        </Section>
      )}

      {workExp.length > 0 && (
        <Section icon={<Briefcase size={14} />} title="Work Experience">
          {workExp.map((w, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < workExp.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{w.position || '—'}</div>
              {w.company && <div style={{ fontSize: 12, color: '#64748b' }}>{w.company}</div>}
              {(w.startDate || w.endDate) && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{w.startDate} – {w.endDate || 'Present'}</div>}
            </div>
          ))}
        </Section>
      )}

      {interests.length > 0 && <Section icon={<BookOpen size={14} />} title="Interests"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{interests.map(interest => <span key={interest} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#faf5ff', color: '#7c3aed', fontWeight: 500 }}>{interest}</span>)}</div></Section>}
    </div>
  );
};

const PartnerReadOnlyView = ({ profile }) => {
  const name = profile.company_name || 'Industry Partner';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const location = [profile.city, profile.province].filter(Boolean).join(', ') || profile.region || null;
  const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
  const benefits = Array.isArray(profile.benefits) ? profile.benefits : [];
  const culture_tags = Array.isArray(profile.culture_tags) ? profile.culture_tags : [];
  const perks_tags = Array.isArray(profile.perks_tags) ? profile.perks_tags : [];

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 44 }}>
        <div style={{ height: 84, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', overflow: 'hidden' }}>
          {profile.banner_url && <img src={profile.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{
          position: 'absolute', bottom: -28, left: 20,
          width: 58, height: 58, borderRadius: 12, border: '3px solid white',
          background: profile.company_logo_url ? 'transparent' : 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800,
          color: 'white', overflow: 'hidden', flexShrink: 0
        }}>
          {profile.company_logo_url
            ? <img src={profile.company_logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{name}</div>
        {profile.business_type && <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 2 }}>{profile.business_type}</div>}
        {profile.verification_status === 'verified' && <div style={{ marginTop: 6 }}><span className="ln-badge ln-badge-green">✓ Verified Partner</span></div>}
      </div>

      <div className="ln-info-grid" style={{ padding: '0 20px 16px' }}>
        {[
          location && ['Location', location],
          profile.contact_person && ['Contact Person', profile.contact_person],
          profile.contact_email && ['Email', profile.contact_email],
          profile.contact_phone && ['Phone', profile.contact_phone],
          profile.company_size && ['Company Size', profile.company_size],
        ].filter(Boolean).map(([label, value]) => (
          <div key={label} className="ln-info-item">
            <label className="ln-info-label">{label}</label>
            <div className="ln-info-value">{value}</div>
          </div>
        ))}
      </div>

      {profile.website && (
        <div style={{ padding: '0 20px 16px' }}>
          <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0a66c2', textDecoration: 'none', fontWeight: 500 }}>
            <Globe size={13} /> {profile.website}
          </a>
        </div>
      )}

      {(profile.mission || profile.vision) && (
        <Section icon={<Star size={14} />} title="Company Focus">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {profile.mission && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Mission</div>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{profile.mission}</p>
              </div>
            )}
            {profile.vision && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Vision</div>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{profile.vision}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {(culture_tags.length > 0 || perks_tags.length > 0) && (
        <Section icon={<Star size={14} />} title="Work Environment & Benefits">
          {culture_tags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Work Culture</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {culture_tags.map(t => <span key={t} className="ln-cert-tag" style={{ fontSize: 11.5 }}>{t}</span>)}
              </div>
            </div>
          )}
          {perks_tags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Perks & Benefits</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {perks_tags.map(t => <span key={t} style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, background: '#fdf2f2', color: '#991b1b', fontWeight: 500 }}>{t}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {profile.poc_name && (
        <Section icon={<User size={14} />} title="Point of Contact">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
              {profile.poc_photo_url ? <img src={profile.poc_photo_url} alt="POC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} style={{ margin: '12px auto', display: 'block', color: '#94a3b8' }} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{profile.poc_name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{profile.poc_title || 'Company Representative'}</div>
            </div>
          </div>
        </Section>
      )}

      {achievements.length > 0 && <Section icon={<Award size={14} />} title="Achievements"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{achievements.map(a => <span key={a} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 500 }}>{a}</span>)}</div></Section>}
    </div>
  );
};

const ProfilePage = ({ profileId, profileType, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId || !profileType) return;
    setLoading(true);
    setError(null);
    setProfile(null);

    const fetchProfile = async () => {
      try {
        const fetchPublicProfileFallback = async () => {
          const fallbackType = profileType === 'trainee' ? 'trainee' : 'partner';
          const response = await fetch(`/api/public-profile/${fallbackType}/${profileId}`);
          if (!response.ok) return null;
          const payload = await response.json();
          return payload?.profile || null;
        };

        if (profileType === 'trainee') {
          const { data, error: err } = await supabase
            .from('students')
            .select(`
              id, full_name, profile_picture_url, banner_url, contact_email,
              detailed_address, city, province, region, gender, birthdate,
              graduation_year, training_status, employment_status, employment_work,
              certifications, educ_history, work_experience, skills, interests,
              programs ( name )
            `)
            .eq('id', profileId)
            .single();
          if (err || !data) {
            const fallbackProfile = await fetchPublicProfileFallback();
            if (!fallbackProfile) throw err || new Error('Profile not found');
            setProfile(fallbackProfile);
          } else {
            setProfile(data);
          }
        } else if (profileType === 'partner') {
          const { data, error: err } = await supabase
            .from('industry_partners')
            .select(`
              id, company_name, company_logo_url, business_type, company_size,
              website, contact_person, contact_email, contact_phone,
              city, province, region, achievements, benefits, verification_status,
              banner_url, mission, vision, culture_tags, perks_tags,
              poc_name, poc_title, poc_photo_url, office_location_url
            `)
            .eq('id', profileId)
            .single();
          if (err || !data) {
            const fallbackProfile = await fetchPublicProfileFallback();
            if (!fallbackProfile) throw err || new Error('Profile not found');
            setProfile(fallbackProfile);
          } else {
            setProfile(data);
          }
        }
      } catch (e) {
        setError('Failed to load profile.');
        console.error('ProfilePage fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, profileType]);

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">{profileType === 'trainee' ? 'Trainee Profile' : 'Company Profile'}</h1>
          <p className="ln-page-subtitle">Read-only view</p>
        </div>
        <button className="ln-btn ln-btn-outline" onClick={onBack}><ArrowLeft size={14} /> Back</button>
      </div>

      <div className="ln-card" style={{ maxWidth: 760, margin: '0 auto', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <User size={16} color="#7c3aed" />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{profileType === 'trainee' ? 'Trainee Profile' : 'Company Profile'}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>• View only</span>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}><div style={{ fontSize: 14 }}>Loading profile...</div></div>}
        {error && <div style={{ textAlign: 'center', padding: '56px 0', color: '#dc2626' }}><div style={{ fontSize: 14 }}>{error}</div></div>}
        {!loading && !error && profile && profileType === 'trainee' && <TraineeReadOnlyView profile={profile} />}
        {!loading && !error && profile && profileType === 'partner' && <PartnerReadOnlyView profile={profile} />}
      </div>
    </div>
  );
};

export default ProfilePage;
