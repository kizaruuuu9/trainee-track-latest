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
  const [userRole, setUserRole] = useState(null); // 'admin' | 'trainee' | 'partner'

  // ─── TRAINEES ────────────────────────────────────────────────────────────
  const [trainees, setTrainees] = useState([
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
      employmentStatus: 'Employed',
      employer: 'TechSolutions Inc.',
      jobTitle: 'Junior IT Technician',
      dateHired: '2024-09-01',
      monthsAfterGraduation: 5,
      photo: null,
      documents: { resume: 'uploaded', diploma: 'uploaded', tor: 'uploaded' },
      achievements: ['Best Trainee 2024', 'Dean\'s Lister'],
      accountStatus: 'Active', // Active | Disabled | Suspended
      certificationProgress: [
        {
          certification: 'CSS NC II',
          status: 'Completed',
          enrolledDate: '2023-06-01',
          competencies: [
            { name: 'Install and configure computer systems', status: 'Passed', remarks: 'Excellent performance' },
            { name: 'Set up computer networks', status: 'Passed', remarks: '' },
            { name: 'Configure computer systems', status: 'Passed', remarks: '' },
            { name: 'Diagnose and troubleshoot computer systems', status: 'Passed', remarks: '' },
            { name: 'Diagnose and troubleshoot network problems', status: 'Passed', remarks: '' },
          ],
        },
        {
          certification: 'Web Development NC III',
          status: 'In Progress',
          enrolledDate: '2025-09-01',
          competencies: [
            { name: 'Develop interactive website', status: 'Passed', remarks: '' },
            { name: 'Apply programming skills', status: 'Passed', remarks: '' },
            { name: 'Use web development tools', status: 'Passed', remarks: '' },
            { name: 'Employ best practice in developing websites', status: 'Pending Assessment', remarks: '' },
            { name: 'Ensure website accessibility', status: 'Pending Assessment', remarks: '' },
          ],
        },
      ],
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
      accountStatus: 'Active',
      certificationProgress: [
        {
          certification: 'Electrical Installation NC II',
          status: 'In Progress',
          enrolledDate: '2025-06-15',
          competencies: [
            { name: 'Terminate and connect electrical wiring', status: 'Passed', remarks: '' },
            { name: 'Install electrical protective devices', status: 'Passed', remarks: '' },
            { name: 'Install lighting fixtures', status: 'Passed', remarks: '' },
            { name: 'Install power load equipment', status: 'Failed', remarks: 'Needs to retake practical exam' },
          ],
        },
      ],
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
      accountStatus: 'Active',
      certificationProgress: [
        {
          certification: 'Automotive NC II',
          status: 'Completed',
          enrolledDate: '2022-06-01',
          competencies: [
            { name: 'Perform mensuration and calculation', status: 'Passed', remarks: '' },
            { name: 'Interpret drawings and sketches', status: 'Passed', remarks: '' },
            { name: 'Perform shop maintenance', status: 'Passed', remarks: '' },
            { name: 'Inspect and repair engine systems', status: 'Passed', remarks: '' },
            { name: 'Service fuel and emission systems', status: 'Passed', remarks: '' },
          ],
        },
        {
          certification: 'Welding NC I',
          status: 'Completed',
          enrolledDate: '2023-01-15',
          competencies: [
            { name: 'Weld carbon steel pipes using SMAW process', status: 'Passed', remarks: '' },
            { name: 'Weld carbon steel plates using MIG/MAG process', status: 'Passed', remarks: '' },
            { name: 'Assess weld quality', status: 'Passed', remarks: '' },
          ],
        },
      ],
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
      accountStatus: 'Active',
      certificationProgress: [
        {
          certification: 'CSS NC II',
          status: 'In Progress',
          enrolledDate: '2025-08-01',
          competencies: [
            { name: 'Install and configure computer systems', status: 'Passed', remarks: '' },
            { name: 'Set up computer networks', status: 'Pending Assessment', remarks: '' },
            { name: 'Configure computer systems', status: 'Pending Assessment', remarks: '' },
            { name: 'Diagnose and troubleshoot computer systems', status: 'Passed', remarks: '' },
            { name: 'Diagnose and troubleshoot network problems', status: 'Pending Assessment', remarks: '' },
          ],
        },
      ],
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
      verificationStatus: 'Verified',
      accountStatus: 'Active',
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
      verificationStatus: 'Verified',
      accountStatus: 'Active',
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
      verificationStatus: 'Pending Verification',
      accountStatus: 'Active',
      documents: { businessPermit: 'uploaded', secRegistration: null },
      createdAt: new Date().toISOString(),
    },
  ]);

  // ─── JOB / OPPORTUNITY POSTINGS ──────────────────────────────────────────
  const [jobPostings, setJobPostings] = useState([
    {
      id: 1,
      partnerId: 1,
      companyName: 'TechSolutions Inc.',
      industry: 'Information Technology',
      title: 'Junior IT Technician',
      opportunityType: 'Job', // Job | OJT | Apprenticeship
      ncLevel: 'CSS NC II',
      requiredCompetencies: [
        'Install and configure computer systems',
        'Set up computer networks',
        'Diagnose and troubleshoot computer systems',
      ],
      description: 'We are looking for CSS NC II certified technicians to join our growing IT support team. Full training provided for fresh trainees.',
      employmentType: 'Full-time',
      location: 'Makati City',
      salaryRange: '₱18,000 – ₱22,000/month',
      slots: 5,
      status: 'Open',
      datePosted: '2026-02-01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      partnerId: 1,
      companyName: 'TechSolutions Inc.',
      industry: 'Information Technology',
      title: 'Web Developer Trainee',
      opportunityType: 'OJT',
      ncLevel: 'Web Development NC III',
      requiredCompetencies: [
        'Develop interactive website',
        'Apply programming skills',
        'Use web development tools',
      ],
      description: 'Join our web development team as an OJT trainee. You will work on real client projects under senior developers.',
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
      opportunityType: 'Job',
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
      title: 'Welder / Fabricator Apprentice',
      opportunityType: 'Apprenticeship',
      ncLevel: 'Welding NC I',
      requiredCompetencies: [
        'Weld carbon steel pipes using SMAW process',
        'Weld carbon steel plates using MIG/MAG process',
      ],
      description: 'We need skilled welders for our fabrication shop. Apprenticeship program for NC I holders or those currently enrolled.',
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
      traineeId: 1,
      jobId: 1,
      status: 'Accepted',
      appliedAt: '2026-02-05',
      reviewedAt: '2026-02-10',
      notes: 'Excellent candidate with complete certifications.',
    },
    {
      id: 2,
      traineeId: 1,
      jobId: 2,
      status: 'Pending',
      appliedAt: '2026-02-12',
      reviewedAt: null,
      notes: null,
    },
    {
      id: 3,
      traineeId: 4,
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
    accountStatus: 'Active',
  });

  // ─── ACTIVITY LOG ──────────────────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState([
    { id: 1, user: 'PSTDII Admin', action: 'Create', module: 'Trainees', description: 'Added trainee Juan Dela Cruz', prevValue: null, newValue: 'Juan Dela Cruz', timestamp: '2026-02-01T09:00:00' },
    { id: 2, user: 'PSTDII Admin', action: 'Create', module: 'Trainees', description: 'Added trainee Maria Santos', prevValue: null, newValue: 'Maria Santos', timestamp: '2026-02-01T09:15:00' },
    { id: 3, user: 'PSTDII Admin', action: 'Status Change', module: 'Partners', description: 'Approved partner TechSolutions Inc.', prevValue: 'Pending', newValue: 'Approved', timestamp: '2026-02-02T10:00:00' },
    { id: 4, user: 'TechSolutions Inc.', action: 'Create', module: 'Opportunities', description: 'Posted opportunity: Junior IT Technician', prevValue: null, newValue: 'Junior IT Technician', timestamp: '2026-02-03T14:30:00' },
    { id: 5, user: 'PSTDII Admin', action: 'Edit', module: 'Trainees', description: 'Updated employment status for Pedro Reyes', prevValue: 'Unemployed', newValue: 'Self-Employed', timestamp: '2026-02-10T11:00:00' },
  ]);

  const logActivity = (action, module, description, prevValue = null, newValue = null) => {
    const entry = {
      id: activityLog.length + 1,
      user: currentUser?.name || currentUser?.companyName || 'System',
      action,
      module,
      description,
      prevValue,
      newValue,
      timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => [entry, ...prev]);
  };

  // ─── MATCH RATE CALCULATION ───────────────────────────────────────────────
  const getMatchRate = (traineeId, jobId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!trainee || !job) return 0;
    if (job.requiredCompetencies.length === 0) return 100;
    const matched = job.requiredCompetencies.filter(c => trainee.competencies.includes(c));
    return Math.round((matched.length / job.requiredCompetencies.length) * 100);
  };

  const getGapAnalysis = (traineeId, jobId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!trainee || !job) return [];
    return job.requiredCompetencies.map(comp => ({
      competency: comp,
      status: trainee.competencies.includes(comp) ? 'Matched' : 'Missing',
    }));
  };

  const getTraineeRecommendedJobs = (traineeId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    if (!trainee) return [];
    return jobPostings
      .filter(j => j.status === 'Open')
      .map(j => ({ ...j, matchRate: getMatchRate(traineeId, j.id) }))
      .sort((a, b) => b.matchRate - a.matchRate);
  };

  // ─── APPLICATION FUNCTIONS ────────────────────────────────────────────────
  const applyToJob = (traineeId, jobId) => {
    const existing = applications.find(a => a.traineeId === traineeId && a.jobId === jobId);
    if (existing) return { success: false, error: 'Already applied to this opportunity.' };
    const job = jobPostings.find(j => j.id === jobId);
    const trainee = trainees.find(t => t.id === traineeId);
    const newApplication = {
      id: applications.length + 1,
      traineeId,
      jobId,
      status: 'Pending',
      appliedAt: new Date().toISOString().split('T')[0],
      reviewedAt: null,
      notes: null,
    };
    setApplications([...applications, newApplication]);
    logActivity('Create', 'Applications', `${trainee?.name || 'Trainee'} applied to ${job?.title || 'opportunity'}`, null, 'Pending');
    return { success: true };
  };

  const updateApplicationStatus = (applicationId, status, notes = null) => {
    const app = applications.find(a => a.id === applicationId);
    const prevStatus = app?.status;
    setApplications(applications.map(a =>
      a.id === applicationId ? { ...a, status, notes, reviewedAt: new Date().toISOString().split('T')[0] } : a
    ));
    logActivity('Status Change', 'Applications', `Application #${applicationId} status changed`, prevStatus, status);
  };

  const getTraineeApplications = (traineeId) => {
    return applications.filter(a => a.traineeId === traineeId).map(a => {
      const job = jobPostings.find(j => j.id === a.jobId);
      return { ...a, job };
    });
  };

  const getJobApplicants = (jobId) => {
    return applications.filter(a => a.jobId === jobId).map(a => {
      const trainee = trainees.find(t => t.id === a.traineeId);
      return { ...a, trainee, matchRate: getMatchRate(a.traineeId, jobId) };
    });
  };

  const getPartnerApplicants = (partnerId) => {
    const partnerJobs = jobPostings.filter(j => j.partnerId === partnerId);
    return partnerJobs.flatMap(job =>
      applications.filter(a => a.jobId === job.id).map(a => {
        const trainee = trainees.find(t => t.id === a.traineeId);
        return { ...a, trainee, job, matchRate: getMatchRate(a.traineeId, job.id) };
      })
    );
  };

  // ─── JOB / OPPORTUNITY FUNCTIONS ───────────────────────────────────────────
  const addJobPosting = (jobData) => {
    const partner = partners.find(p => p.id === currentUser?.id);
    const newJob = {
      ...jobData,
      id: jobPostings.length + 1,
      partnerId: currentUser?.id,
      companyName: partner?.companyName || 'Company',
      opportunityType: jobData.opportunityType || 'Job',
      status: 'Open',
      datePosted: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setJobPostings([...jobPostings, newJob]);
    logActivity('Create', 'Opportunities', `Posted opportunity: ${newJob.title}`, null, newJob.title);
    return newJob;
  };

  const updateJobPosting = (jobId, updates) => {
    const existing = jobPostings.find(j => j.id === jobId);
    setJobPostings(jobPostings.map(j => j.id === jobId ? { ...j, ...updates } : j));
    if (updates.status) {
      logActivity('Status Change', 'Opportunities', `${existing?.title} status changed`, existing?.status, updates.status);
    } else {
      logActivity('Edit', 'Opportunities', `Updated opportunity: ${existing?.title}`, null, null);
    }
  };

  const deleteJobPosting = (jobId) => {
    const existing = jobPostings.find(j => j.id === jobId);
    setJobPostings(jobPostings.filter(j => j.id !== jobId));
    logActivity('Delete', 'Opportunities', `Deleted opportunity: ${existing?.title}`, existing?.title, null);
  };

  // ─── PARTNER FUNCTIONS ───────────────────────────────────────────────────
  const approvePartner = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    setPartners(partners.map(p =>
      p.id === partnerId ? { ...p, verificationStatus: 'Verified' } : p
    ));
    logActivity('Status Change', 'Partners', `Verified partner: ${partner?.companyName}`, partner?.verificationStatus, 'Verified');
  };

  const rejectPartner = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    setPartners(partners.map(p =>
      p.id === partnerId ? { ...p, verificationStatus: 'Rejected' } : p
    ));
    logActivity('Status Change', 'Partners', `Rejected partner: ${partner?.companyName}`, partner?.verificationStatus, 'Rejected');
  };

  const registerPartner = (partnerData) => {
    const newPartner = {
      ...partnerData,
      id: partners.length + 1,
      verificationStatus: 'Pending Verification',
      accountStatus: 'Active',
      documents: partnerData.documents || {},
      createdAt: new Date().toISOString(),
    };
    setPartners([...partners, newPartner]);
    logActivity('Create', 'Partners', `New partner registered: ${newPartner.companyName}`, null, newPartner.companyName);
    return newPartner;
  };

  const submitPartnerDocuments = (partnerId, documents) => {
    const partner = partners.find(p => p.id === partnerId);
    setPartners(partners.map(p =>
      p.id === partnerId ? { ...p, documents: { ...p.documents, ...documents }, verificationStatus: 'Under Review' } : p
    ));
    if (currentUser?.id === partnerId) {
      setCurrentUser(prev => ({ ...prev, documents: { ...prev.documents, ...documents }, verificationStatus: 'Under Review' }));
    }
    logActivity('Status Change', 'Partners', `${partner?.companyName} submitted documents for verification`, partner?.verificationStatus, 'Under Review');
  };

  // ─── TRAINEE FUNCTIONS ──────────────────────────────────────────────────
  const addTrainee = (traineeData) => {
    const newTrainee = {
      ...traineeData,
      id: trainees.length + 1,
      competencies: [],
      employmentStatus: 'Unemployed',
      employer: null,
      jobTitle: null,
      dateHired: null,
      monthsAfterGraduation: null,
      photo: null,
      documents: {},
      achievements: [],
      accountStatus: 'Active',
      certificationProgress: [],
      createdAt: new Date().toISOString(),
    };
    setTrainees([...trainees, newTrainee]);
    logActivity('Create', 'Trainees', `Added trainee: ${newTrainee.name}`, null, newTrainee.name);
    return newTrainee;
  };

  const updateTrainee = (traineeId, updates) => {
    const existing = trainees.find(t => t.id === traineeId);
    setTrainees(trainees.map(t => t.id === traineeId ? { ...t, ...updates } : t));
    if (currentUser?.id === traineeId) setCurrentUser({ ...currentUser, ...updates });
    logActivity('Edit', 'Trainees', `Updated trainee: ${existing?.name}`, null, null);
  };

  const deleteTrainee = (traineeId) => {
    const existing = trainees.find(t => t.id === traineeId);
    setTrainees(trainees.filter(t => t.id !== traineeId));
    logActivity('Delete', 'Trainees', `Deleted trainee: ${existing?.name}`, existing?.name, null);
  };

  // ─── ACCOUNT MANAGEMENT ───────────────────────────────────────────────────
  const updateAccountStatus = (accountType, accountId, newStatus) => {
    if (accountType === 'trainee') {
      const existing = trainees.find(t => t.id === accountId);
      setTrainees(trainees.map(t => t.id === accountId ? { ...t, accountStatus: newStatus } : t));
      logActivity('Status Change', 'Accounts', `${existing?.name} account status changed`, existing?.accountStatus, newStatus);
    } else if (accountType === 'partner') {
      const existing = partners.find(p => p.id === accountId);
      setPartners(partners.map(p => p.id === accountId ? { ...p, accountStatus: newStatus } : p));
      logActivity('Status Change', 'Accounts', `${existing?.companyName} account status changed`, existing?.accountStatus, newStatus);
    }
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
    // Check trainees
    const trainee = trainees.find(t => (t.username === username || t.email === username) && t.password === password);
    if (trainee) {
      if (trainee.accountStatus === 'Disabled') {
        return { success: false, error: 'Your account has been disabled. Please contact the administrator.' };
      }
      if (trainee.accountStatus === 'Suspended') {
        return { success: false, error: 'Your account has been suspended. Please contact the administrator.' };
      }
      setUserRole('trainee');
      setCurrentUser(trainee);
      localStorage.setItem('userRole', 'trainee');
      localStorage.setItem('currentUser', JSON.stringify(trainee));
      return { success: true, role: 'trainee' };
    }
    // Check partners
    const partner = partners.find(p => (p.username === username || p.email === username) && p.password === password);
    if (partner) {
      if (partner.accountStatus === 'Disabled') {
        return { success: false, error: 'Your account has been disabled. Please contact the administrator.' };
      }
      if (partner.accountStatus === 'Suspended') {
        return { success: false, error: 'Your account has been suspended. Please contact the administrator.' };
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
    const total = trainees.length;
    const employed = trainees.filter(t => t.employmentStatus === 'Employed').length;
    const selfEmployed = trainees.filter(t => t.employmentStatus === 'Self-Employed').length;
    const underEmployed = trainees.filter(t => t.employmentStatus === 'Underemployed').length;
    const unemployed = trainees.filter(t => t.employmentStatus === 'Unemployed').length;
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
      // Trainees
      trainees,
      addTrainee,
      updateTrainee,
      deleteTrainee,
      // Partners
      partners,
      approvePartner,
      rejectPartner,
      registerPartner,
      submitPartnerDocuments,
      // Opportunities
      jobPostings,
      addJobPosting,
      updateJobPosting,
      deleteJobPosting,
      // Applications
      applications,
      applyToJob,
      updateApplicationStatus,
      getTraineeApplications,
      getJobApplicants,
      getPartnerApplicants,
      // Matching
      getMatchRate,
      getGapAnalysis,
      getTraineeRecommendedJobs,
      // Analytics
      getEmploymentStats,
      getSkillsDemand,
      // Activity Log
      activityLog,
      logActivity,
      // Account Management
      adminAccount,
      updateAccountStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};
