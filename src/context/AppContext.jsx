import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// All TESDA NC Competencies by qualification
const NC_COMPETENCIES = {
  'CSS NC II': ['Install and configure computer systems', 'Set up computer networks', 'Configure computer systems', 'Diagnose and troubleshoot computer systems', 'Diagnose and troubleshoot network problems'],
  'Web Development NC III': ['Develop interactive website', 'Apply programming skills', 'Use web development tools', 'Employ best practice in developing websites', 'Ensure website accessibility'],
  'Automotive NC II': ['Perform mensuration and calculation', 'Interpret drawings and sketches', 'Perform shop maintenance', 'Inspect and repair engine systems', 'Service fuel and emission systems'],
  'Electrical Installation NC II': ['Terminate and connect electrical wiring', 'Install electrical protective devices', 'Install lighting fixtures', 'Install power load equipment'],
  'Welding NC I': ['Weld carbon steel pipes using SMAW process', 'Weld carbon steel plates using MIG/MAG process', 'Assess weld quality'],
};

export const AppProvider = ({ children }) => {
  const appMetadata = {
    appName: 'TraineeTrack',
    orgName: 'Philippine School for Technology Development and Innovation Inc.',
    logoText: 'TT',
    currentYear: new Date().getFullYear(),
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'graduate' | 'partner'

  // ─── GRADUATES ────────────────────────────────────────────────────────────
  const [graduates, setGraduates] = useState([
    {
      id: 1,
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      username: 'juan.delacruz',
      password: 'grad123',
      phone: '+63 912 345 6789',
      address: 'Caloocan City, Metro Manila',
      birthday: '1999-04-15',
      gender: 'Male',
      graduationYear: 2024,
      certifications: ['CSS NC II', 'Web Development NC III'],
      competencies: [
        'Install and configure computer systems',
        'Set up computer networks',
        'Configure computer systems',
        'Develop interactive website',
        'Apply programming skills',
        'Use web development tools',
      ],
      employmentStatus: 'Employed', // Employed, Unemployed, Self-Employed, Underemployed
      employer: 'TechSolutions Inc.',
      jobTitle: 'Junior IT Technician',
      dateHired: '2024-09-01',
      monthsAfterGraduation: 5,
      photo: null,
      documents: { resume: 'uploaded', diploma: 'uploaded', tor: 'uploaded' },
      achievements: ['Best Graduate 2024', 'Dean\'s Lister'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@example.com',
      username: 'maria.santos',
      password: 'grad123',
      phone: '+63 917 654 3210',
      address: 'Quezon City, Metro Manila',
      birthday: '2000-07-22',
      gender: 'Female',
      graduationYear: 2024,
      certifications: ['Electrical Installation NC II'],
      competencies: [
        'Terminate and connect electrical wiring',
        'Install electrical protective devices',
        'Install lighting fixtures',
      ],
      employmentStatus: 'Unemployed',
      employer: null,
      jobTitle: null,
      dateHired: null,
      monthsAfterGraduation: null,
      photo: null,
      documents: { resume: 'uploaded', diploma: 'uploaded', tor: null },
      achievements: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Pedro Reyes',
      email: 'pedro@example.com',
      username: 'pedro.reyes',
      password: 'grad123',
      phone: '+63 922 111 2222',
      address: 'Malabon City, Metro Manila',
      birthday: '1998-12-05',
      gender: 'Male',
      graduationYear: 2023,
      certifications: ['Automotive NC II', 'Welding NC I'],
      competencies: [
        'Perform mensuration and calculation',
        'Inspect and repair engine systems',
        'Service fuel and emission systems',
        'Weld carbon steel pipes using SMAW process',
        'Weld carbon steel plates using MIG/MAG process',
      ],
      employmentStatus: 'Self-Employed',
      employer: 'Own Auto Shop',
      jobTitle: 'Shop Owner',
      dateHired: '2024-01-10',
      monthsAfterGraduation: 14,
      photo: null,
      documents: { resume: 'uploaded', diploma: null, tor: 'uploaded' },
      achievements: ['Top Performer - Automotive'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      name: 'Ana Lim',
      email: 'ana@example.com',
      username: 'ana.lim',
      password: 'grad123',
      phone: '+63 933 444 5555',
      address: 'Valenzuela City, Metro Manila',
      birthday: '2001-03-18',
      gender: 'Female',
      graduationYear: 2024,
      certifications: ['CSS NC II'],
      competencies: [
        'Install and configure computer systems',
        'Diagnose and troubleshoot computer systems',
      ],
      employmentStatus: 'Underemployed',
      employer: 'SM Department Store',
      jobTitle: 'Sales Associate',
      dateHired: '2024-07-15',
      monthsAfterGraduation: 7,
      photo: null,
      documents: { resume: 'uploaded', diploma: 'uploaded', tor: 'uploaded' },
      achievements: [],
      createdAt: new Date().toISOString(),
    },
  ]);

  // ─── INDUSTRY PARTNERS ──────────────────────────────────────────────────────
  const [partners, setPartners] = useState([
    {
      id: 1,
      companyName: 'TechSolutions Inc.',
      contactPerson: 'Roberto Cruz',
      email: 'hr@techsolutions.ph',
      username: 'techsolutions',
      password: 'partner123',
      phone: '+63 912 345 6789',
      address: 'Makati City, Metro Manila',
      industry: 'Information Technology',
      companySize: '51-200',
      website: 'www.techsolutions.ph',
      verificationStatus: 'Approved', // Pending, Approved, Rejected
      documents: { businessPermit: 'uploaded', secRegistration: 'uploaded' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      companyName: 'AutoMech Corporation',
      contactPerson: 'Lilian Flores',
      email: 'hr@automech.com.ph',
      username: 'automech',
      password: 'partner123',
      phone: '+63 917 987 6543',
      address: 'Caloocan City, Metro Manila',
      industry: 'Automotive',
      companySize: '201-500',
      website: 'www.automech.com.ph',
      verificationStatus: 'Approved',
      documents: { businessPermit: 'uploaded', secRegistration: 'uploaded' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      companyName: 'PowerGrid Solutions',
      contactPerson: 'Mark Villanueva',
      email: 'jobs@powergrid.ph',
      username: 'powergrid',
      password: 'partner123',
      phone: '+63 922 333 4444',
      address: 'Quezon City, Metro Manila',
      industry: 'Electrical / Construction',
      companySize: '11-50',
      website: 'www.powergrid.ph',
      verificationStatus: 'Pending',
      documents: { businessPermit: 'uploaded', secRegistration: null },
      createdAt: new Date().toISOString(),
    },
  ]);

  // ─── JOB POSTINGS ──────────────────────────────────────────────────────────
  const [jobPostings, setJobPostings] = useState([
    {
      id: 1,
      partnerId: 1,
      companyName: 'TechSolutions Inc.',
      industry: 'Information Technology',
      title: 'Junior IT Technician',
      ncLevel: 'CSS NC II',
      requiredCompetencies: [
        'Install and configure computer systems',
        'Set up computer networks',
        'Diagnose and troubleshoot computer systems',
      ],
      description: 'We are looking for CSS NC II certified technicians to join our growing IT support team. Full training provided for fresh graduates.',
      employmentType: 'Full-time',
      location: 'Makati City',
      salaryRange: '₱18,000 – ₱22,000/month',
      slots: 5,
      status: 'Open', // Open, Closed, Filled
      datePosted: '2026-02-01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      partnerId: 1,
      companyName: 'TechSolutions Inc.',
      industry: 'Information Technology',
      title: 'Web Developer Trainee',
      ncLevel: 'Web Development NC III',
      requiredCompetencies: [
        'Develop interactive website',
        'Apply programming skills',
        'Use web development tools',
      ],
      description: 'Join our web development team as a trainee. You will work on real client projects under senior developers.',
      employmentType: 'Full-time',
      location: 'Makati City',
      salaryRange: '₱20,000 – ₱25,000/month',
      slots: 3,
      status: 'Open',
      datePosted: '2026-02-10',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      partnerId: 2,
      companyName: 'AutoMech Corporation',
      industry: 'Automotive',
      title: 'Automotive Technician',
      ncLevel: 'Automotive NC II',
      requiredCompetencies: [
        'Inspect and repair engine systems',
        'Service fuel and emission systems',
        'Perform mensuration and calculation',
      ],
      description: 'AutoMech is hiring automotive technicians for our service center. NC II holders are preferred.',
      employmentType: 'Full-time',
      location: 'Caloocan City',
      salaryRange: '₱16,000 – ₱20,000/month',
      slots: 10,
      status: 'Open',
      datePosted: '2026-01-20',
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      partnerId: 2,
      companyName: 'AutoMech Corporation',
      industry: 'Automotive',
      title: 'Welder / Fabricator',
      ncLevel: 'Welding NC I',
      requiredCompetencies: [
        'Weld carbon steel pipes using SMAW process',
        'Weld carbon steel plates using MIG/MAG process',
      ],
      description: 'We need skilled welders for our fabrication shop. Experience preferred but fresh NC I holders are welcome.',
      employmentType: 'Full-time',
      location: 'Caloocan City',
      salaryRange: '₱15,000 – ₱18,000/month',
      slots: 4,
      status: 'Filled',
      datePosted: '2025-12-01',
      createdAt: new Date().toISOString(),
    },
  ]);

  // ─── APPLICATIONS ─────────────────────────────────────────────────────────
  const [applications, setApplications] = useState([
    {
      id: 1,
      graduateId: 1,
      jobId: 1,
      status: 'Accepted', // Pending, Accepted, Rejected
      appliedAt: '2026-02-05',
      reviewedAt: '2026-02-10',
      notes: 'Excellent candidate with complete certifications.',
    },
    {
      id: 2,
      graduateId: 1,
      jobId: 2,
      status: 'Pending',
      appliedAt: '2026-02-12',
      reviewedAt: null,
      notes: null,
    },
    {
      id: 3,
      graduateId: 4,
      jobId: 1,
      status: 'Rejected',
      appliedAt: '2026-02-06',
      reviewedAt: '2026-02-11',
      notes: 'Missing required network setup competency.',
    },
  ]);

  // ─── ADMIN ACCOUNT ────────────────────────────────────────────────────────
  const [adminAccount] = useState({
    id: 1,
    name: 'PSTDII Admin',
    email: 'admin@pstdii.edu.ph',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    phone: '+63 2 8000 0000',
    position: 'System Administrator',
  });

  // ─── MATCH RATE CALCULATION ───────────────────────────────────────────────
  const getMatchRate = (graduateId, jobId) => {
    const graduate = graduates.find(g => g.id === graduateId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!graduate || !job) return 0;
    if (job.requiredCompetencies.length === 0) return 100;
    const matched = job.requiredCompetencies.filter(c => graduate.competencies.includes(c));
    return Math.round((matched.length / job.requiredCompetencies.length) * 100);
  };

  const getGapAnalysis = (graduateId, jobId) => {
    const graduate = graduates.find(g => g.id === graduateId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!graduate || !job) return [];
    return job.requiredCompetencies.map(comp => ({
      competency: comp,
      status: graduate.competencies.includes(comp) ? 'Matched' : 'Missing',
    }));
  };

  const getGraduateRecommendedJobs = (graduateId) => {
    const graduate = graduates.find(g => g.id === graduateId);
    if (!graduate) return [];
    return jobPostings
      .filter(j => j.status === 'Open')
      .map(j => ({ ...j, matchRate: getMatchRate(graduateId, j.id) }))
      .sort((a, b) => b.matchRate - a.matchRate);
  };

  // ─── APPLICATION FUNCTIONS ────────────────────────────────────────────────
  const applyToJob = (graduateId, jobId) => {
    const existing = applications.find(a => a.graduateId === graduateId && a.jobId === jobId);
    if (existing) return { success: false, error: 'Already applied to this job.' };
    const newApplication = {
      id: applications.length + 1,
      graduateId,
      jobId,
      status: 'Pending',
      appliedAt: new Date().toISOString().split('T')[0],
      reviewedAt: null,
      notes: null,
    };
    setApplications([...applications, newApplication]);
    return { success: true };
  };

  const updateApplicationStatus = (applicationId, status, notes = null) => {
    setApplications(applications.map(a =>
      a.id === applicationId ? { ...a, status, notes, reviewedAt: new Date().toISOString().split('T')[0] } : a
    ));
  };

  const getGraduateApplications = (graduateId) => {
    return applications.filter(a => a.graduateId === graduateId).map(a => {
      const job = jobPostings.find(j => j.id === a.jobId);
      return { ...a, job };
    });
  };

  const getJobApplicants = (jobId) => {
    return applications.filter(a => a.jobId === jobId).map(a => {
      const graduate = graduates.find(g => g.id === a.graduateId);
      return { ...a, graduate, matchRate: getMatchRate(a.graduateId, jobId) };
    });
  };

  const getPartnerApplicants = (partnerId) => {
    const partnerJobs = jobPostings.filter(j => j.partnerId === partnerId);
    return partnerJobs.flatMap(job =>
      applications.filter(a => a.jobId === job.id).map(a => {
        const graduate = graduates.find(g => g.id === a.graduateId);
        return { ...a, graduate, job, matchRate: getMatchRate(a.graduateId, job.id) };
      })
    );
  };

  // ─── JOB FUNCTIONS ───────────────────────────────────────────────────────
  const addJobPosting = (jobData) => {
    const partner = partners.find(p => p.id === currentUser?.id);
    const newJob = {
      ...jobData,
      id: jobPostings.length + 1,
      partnerId: currentUser?.id,
      companyName: partner?.companyName || 'Company',
      status: 'Open',
      datePosted: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setJobPostings([...jobPostings, newJob]);
    return newJob;
  };

  const updateJobPosting = (jobId, updates) => {
    setJobPostings(jobPostings.map(j => j.id === jobId ? { ...j, ...updates } : j));
  };

  const deleteJobPosting = (jobId) => {
    setJobPostings(jobPostings.filter(j => j.id !== jobId));
  };

  // ─── PARTNER FUNCTIONS ───────────────────────────────────────────────────
  const approvePartner = (partnerId) => {
    setPartners(partners.map(p =>
      p.id === partnerId ? { ...p, verificationStatus: 'Approved' } : p
    ));
  };

  const rejectPartner = (partnerId) => {
    setPartners(partners.map(p =>
      p.id === partnerId ? { ...p, verificationStatus: 'Rejected' } : p
    ));
  };

  const registerPartner = (partnerData) => {
    const newPartner = {
      ...partnerData,
      id: partners.length + 1,
      verificationStatus: 'Pending',
      documents: {},
      createdAt: new Date().toISOString(),
    };
    setPartners([...partners, newPartner]);
    return newPartner;
  };

  // ─── GRADUATE FUNCTIONS ──────────────────────────────────────────────────
  const addGraduate = (graduateData) => {
    const newGraduate = {
      ...graduateData,
      id: graduates.length + 1,
      competencies: [],
      employmentStatus: 'Unemployed',
      employer: null,
      jobTitle: null,
      dateHired: null,
      monthsAfterGraduation: null,
      photo: null,
      documents: {},
      achievements: [],
      createdAt: new Date().toISOString(),
    };
    setGraduates([...graduates, newGraduate]);
    return newGraduate;
  };

  const updateGraduate = (graduateId, updates) => {
    setGraduates(graduates.map(g => g.id === graduateId ? { ...g, ...updates } : g));
    if (currentUser?.id === graduateId) setCurrentUser({ ...currentUser, ...updates });
  };

  const deleteGraduate = (graduateId) => {
    setGraduates(graduates.filter(g => g.id !== graduateId));
  };

  // ─── AUTH FUNCTIONS ──────────────────────────────────────────────────────
  const login = (username, password) => {
    // Check admin
    if (adminAccount.username === username && adminAccount.password === password) {
      setUserRole('admin');
      setCurrentUser(adminAccount);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('currentUser', JSON.stringify(adminAccount));
      return { success: true, role: 'admin' };
    }
    // Check graduates
    const graduate = graduates.find(g => (g.username === username || g.email === username) && g.password === password);
    if (graduate) {
      setUserRole('graduate');
      setCurrentUser(graduate);
      localStorage.setItem('userRole', 'graduate');
      localStorage.setItem('currentUser', JSON.stringify(graduate));
      return { success: true, role: 'graduate' };
    }
    // Check partners
    const partner = partners.find(p => (p.username === username || p.email === username) && p.password === password);
    if (partner) {
      if (partner.verificationStatus === 'Pending') {
        return { success: false, error: 'Your account is pending admin approval.' };
      }
      if (partner.verificationStatus === 'Rejected') {
        return { success: false, error: 'Your account has been rejected. Please contact PSTDII.' };
      }
      setUserRole('partner');
      setCurrentUser(partner);
      localStorage.setItem('userRole', 'partner');
      localStorage.setItem('currentUser', JSON.stringify(partner));
      return { success: true, role: 'partner' };
    }
    return { success: false, error: 'Invalid username or password.' };
  };

  const logout = () => {
    setUserRole(null);
    setCurrentUser(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedUser = localStorage.getItem('currentUser');
    if (savedRole && savedUser) {
      setUserRole(savedRole);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // ─── ANALYTICS HELPERS ───────────────────────────────────────────────────
  const getEmploymentStats = () => {
    const total = graduates.length;
    const employed = graduates.filter(g => g.employmentStatus === 'Employed').length;
    const selfEmployed = graduates.filter(g => g.employmentStatus === 'Self-Employed').length;
    const underEmployed = graduates.filter(g => g.employmentStatus === 'Underemployed').length;
    const unemployed = graduates.filter(g => g.employmentStatus === 'Unemployed').length;
    const employmentRate = total > 0 ? Math.round(((employed + selfEmployed) / total) * 100) : 0;
    return { total, employed, selfEmployed, underEmployed, unemployed, employmentRate };
  };

  const getSkillsDemand = () => {
    const competencyCount = {};
    jobPostings.filter(j => j.status === 'Open').forEach(job => {
      job.requiredCompetencies.forEach(comp => {
        competencyCount[comp] = (competencyCount[comp] || 0) + 1;
      });
    });
    return Object.entries(competencyCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  return (
    <AppContext.Provider value={{
      appMetadata,
      currentUser,
      userRole,
      login,
      logout,
      NC_COMPETENCIES,
      // Graduates
      graduates,
      addGraduate,
      updateGraduate,
      deleteGraduate,
      // Partners
      partners,
      approvePartner,
      rejectPartner,
      registerPartner,
      // Jobs
      jobPostings,
      addJobPosting,
      updateJobPosting,
      deleteJobPosting,
      // Applications
      applications,
      applyToJob,
      updateApplicationStatus,
      getGraduateApplications,
      getJobApplicants,
      getPartnerApplicants,
      // Matching
      getMatchRate,
      getGapAnalysis,
      getGraduateRecommendedJobs,
      // Analytics
      getEmploymentStats,
      getSkillsDemand,
    }}>
      {children}
    </AppContext.Provider>
  );
};
