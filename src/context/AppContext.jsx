import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// All TESDA NC Competencies by qualification (16 PSTDI programs)
const NC_COMPETENCIES = {
  'Events Management Services NC III': [
    'Plan and Develop Event Proposal or Bid', 'Develop an Event Concept', 'Develop Event Program',
    'Select Event Venue and Site', 'Develop and Update Event Industry Knowledge',
    'Provide On-Site Event Management Services', 'Manage Contractors for Indoor Events',
    'Develop and Update Knowledge on Protocol', 'Conduct Supervised Industry Learning',
  ],
  'Bread and Pastry Production NC II': [
    'Prepare and Produce Bakery Products', 'Prepare and Produce Pastry Products',
    'Prepare and Present Gateaux, Tortes and Cakes', 'Prepare and Display Petits Fours',
    'Present Desserts', 'Observe Workplace Hygiene Procedures', 'Provide Effective Customer Service',
    'Conduct Supervised Industry Learning',
  ],
  'Barista NC II': [
    'Prepare Espresso', 'Texture Milk', 'Prepare and Serve Coffee Beverages',
    'Perform Basic Maintenance of Machine and Equipment',
    'Perform Basic Cashiering and General Control Procedures',
    'Observe Workplace Hygiene Procedures', 'Provide Effective Customer Service',
  ],
  'Heavy Equipment Operation (Forklift) NC II': [
    'Prepare Construction Materials and Tools', 'Observe Procedures, Specifications and Manuals of Instruction',
    'Interpret Technical Drawings and Plans', 'Perform Mensuration and Calculations',
    'Maintain Tools and Equipment', 'Perform Pre- and Post-Operation Procedures for Forklift',
    'Perform Basic Preventive Maintenance Servicing for Forklift', 'Perform Productive Operation for Forklift',
  ],
  'Contact Center Services NC II': [
    'Apply Quality Standards', 'Perform Computer Operations',
    'Communicate Effectively in English for Customer Service',
    'Perform Customer Service Delivery Processes',
    'Demonstrate Ability to Effectively Engage Customers',
  ],
  'Shielded Metal Arc Welding (SMAW) NC I': [
    'Apply Safety Practices', 'Interpret Drawings and Sketches', 'Perform Industry Calculations',
    'Contribute to Quality System', 'Use Hand Tools', 'Prepare Weld Materials',
    'Setup Welding Equipment', 'Fit Up Weld Materials', 'Repair Welds',
    'Weld Carbon Steel Plates Using SMAW',
  ],
  'Housekeeping NC II': [
    'Provide Housekeeping Services to Guests', 'Clean and Prepare Rooms for Incoming Guests',
    'Provide Valet/Butler Service', 'Laundry Linen and Guest Clothes',
    'Clean Public Areas, Facilities and Equipment', 'Deal With/Handle Intoxicated Guests',
    'Observe Workplace Hygiene Procedures', 'Provide Effective Customer Service',
  ],
  'Food and Beverage Services NC II': [
    'Prepare the Dining Room/Restaurant Area for Service',
    'Welcome Guests and Take Food and Beverage Orders', 'Promote Food and Beverage Products',
    'Provide Food and Beverage Services to Guests', 'Provide Room Service',
    'Receive and Handle Guest Concerns', 'Observe Workplace Hygiene Procedures',
    'Provide Effective Customer Service',
  ],
  'Driving NC II (118 Hours)': [
    'Apply Appropriate Sealant/Adhesive', 'Move and Position Vehicle',
    'Perform Mensuration and Calculation', 'Read, Interpret and Apply Specifications and Manuals',
    'Use and Apply Lubricant/Coolant', 'Perform Shop Maintenance',
    'Carry Out Minor Vehicle Maintenance and Servicing', 'Drive Light Vehicle',
    'Obey and Observe Traffic Rules and Regulations',
    'Implement and Coordinate Accident-Emergency Procedures',
  ],
  'Computer Systems Servicing NC II': [
    'Install and Configure Computer Systems', 'Set-Up Computer Networks',
    'Set-Up Computer Servers', 'Maintain and Repair Computer Systems and Networks',
  ],
  'Hilot (Wellness Massage) NC II': [
    'Implement and Monitor Infection Control Policies and Procedures',
    'Respond Effectively to Difficulty/Challenging Behavior', 'Apply Basic First Aid',
    'Maintain High Standards of Patient/Client Services',
    'Plan the Hilot Wellness Program of Client/s', 'Provide Pre-Service to Hilot Client/s',
    'Apply Hilot Wellness Massage Techniques', 'Provide Post Advice and Post-Services to Hilot Clients',
  ],
  'Driving (Passenger Bus / Straight Truck) NC III': [
    'Apply Appropriate Sealant/Adhesive', 'Interpret/Draw Technical Drawing',
    'Move and Position Vehicle', 'Perform Job Estimate', 'Perform Mensuration and Calculation',
    'Read, Interpret and Apply Specifications and Manuals', 'Use and Apply Lubricant/Coolant',
    'Perform Shop Maintenance',
    'Perform Minor Maintenance and Servicing on Vehicles Classified under LTO Restriction Codes 3 Up to 5',
    'Perform Pre- and Post-Operation Procedures for Vehicles Classified under LTO Restriction Codes 3 Up to 5',
    'Obey and Observe Traffic Rules and Regulations', 'Observe Road Health and Safety Practices',
    'Implement and Coordinate Accident-Emergency Procedures',
    'Drive Passenger Bus', 'Drive Straight Truck',
  ],
  'Cookery NC II': [
    'Clean and Maintain Kitchen Premises', 'Prepare Stocks, Sauces and Soups',
    'Prepare Appetizers', 'Prepare Salads and Dressing', 'Prepare Sandwiches',
    'Prepare Meat Dishes', 'Prepare Vegetable Dishes', 'Prepare Egg Dishes',
    'Prepare Starch Dishes', 'Prepare Poultry and Game Dishes', 'Prepare Seafood Dishes',
    'Prepare Desserts', 'Package Prepared Food',
    'Observe Workplace Hygiene Procedures', 'Provide Effective Customer Service',
  ],
  'Driving NC II (137 Hours)': [
    'Apply Appropriate Sealant/Adhesive', 'Move and Position Vehicle',
    'Perform Mensuration and Calculation', 'Read, Interpret and Apply Specifications and Manuals',
    'Use and Apply Lubricant/Coolant', 'Perform Shop Maintenance',
    'Carry Out Minor Vehicle Maintenance and Servicing', 'Drive Light Vehicle',
    'Obey and Observe Traffic Rules and Regulations',
    'Implement and Coordinate Accident-Emergency Procedures',
  ],
  'Automotive Servicing NC I': [
    'Validate Vehicle Specification', 'Move and Position Vehicle', 'Utilize Automotive Tools',
    'Perform Mensuration and Calculation', 'Utilize Workshop Facilities and Equipment',
    'Prepare Servicing Parts and Consumables', 'Prepare Vehicle for Servicing and Releasing',
    'Perform Pre-Delivery Inspection', 'Perform Periodic Maintenance of Automotive Engine',
    'Perform Periodic Maintenance of Drive Train', 'Perform Periodic Maintenance of Brake System',
    'Perform Periodic Maintenance of Suspension System', 'Perform Periodic Maintenance of Steering System',
  ],
  'Automotive Servicing (Engine Repair) NC II': [
    'Validate Vehicle Specification', 'Move and Position Vehicle', 'Utilize Automotive Tools',
    'Perform Mensuration and Calculation', 'Utilize Workshop Facilities and Equipment',
    'Prepare Servicing Parts and Consumables', 'Prepare Vehicle for Servicing and Releasing',
    'Diagnose and Repair Engine Cooling and Lubrication System',
    'Diagnose and Repair Intake and Exhaust System',
    'Diagnose and Overhaul Engine Mechanical System',
  ],
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
  const [trainees, setTrainees] = useState([]);

  // ─── INDUSTRY PARTNERS ──────────────────────────────────────────────────────
  const [partners, setPartners] = useState([]);

  // ─── JOB / OPPORTUNITY POSTINGS ──────────────────────────────────────────
  const [jobPostings, setJobPostings] = useState([
    {
      id: 1,
      partnerId: 1,
      companyName: 'TechSolutions Inc.',
      industry: 'Information Technology',
      title: 'Junior IT Technician',
      opportunityType: 'Job', // Job | OJT | Apprenticeship
      ncLevel: 'Computer Systems Servicing NC II',
      requiredCompetencies: [
        'Install and Configure Computer Systems',
        'Set-Up Computer Networks',
        'Maintain and Repair Computer Systems and Networks',
      ],
      requiredSkills: ['Problem Solving', 'Teamwork', 'Communication'],
      description: 'We are looking for Computer Systems Servicing NC II certified technicians to join our growing IT support team. Full training provided for fresh trainees.',
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
      ncLevel: 'Contact Center Services NC II',
      requiredCompetencies: [
        'Communicate Effectively in English for Customer Service',
        'Perform Customer Service Delivery Processes',
        'Demonstrate Ability to Effectively Engage Customers',
      ],
      requiredSkills: ['Communication', 'English Proficiency', 'Customer Service', 'Problem Solving'],
      description: 'Join our contact center team as an OJT trainee. You will handle customer interactions under senior team leads.',
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
      ncLevel: 'Automotive Servicing NC I',
      requiredCompetencies: [
        'Perform Periodic Maintenance of Automotive Engine',
        'Perform Periodic Maintenance of Brake System',
        'Perform Mensuration and Calculation',
      ],
      requiredSkills: ['Problem Solving', 'Critical Thinking', 'Teamwork'],
      description: 'AutoMech is hiring automotive technicians for our service center. Automotive Servicing NC holders are preferred.',
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
      ncLevel: 'Shielded Metal Arc Welding (SMAW) NC I',
      requiredCompetencies: [
        'Weld Carbon Steel Plates Using SMAW',
        'Setup Welding Equipment',
      ],
      requiredSkills: ['Teamwork', 'Time Management'],
      description: 'We need skilled welders for our fabrication shop. Apprenticeship program for SMAW NC I holders or those currently enrolled.',
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

  // ─── COMMUNITY POSTS ──────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const createPost = async (postData) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to post');

      const newPost = {
        author_id: currentUser.id,
        author_type: userRole === 'partner' ? 'industry_partner' : 'student',
        ...postData,
        tags: postData.tags || [],
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating post:', err);
      return { success: false, error: err.message };
    }
  };

  // ─── ADMIN ACCOUNT ────────────────────────────────────────────────────────
  const [adminAccount] = useState({
    id: 1,
    name: 'PSTDII Admin',
    email: 'admin@pstdii.edu.ph',
    username: 'admin',
    password: 'admin123',
    role: 'admin',

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

  // Fetch external jobs from Remotive API
  useEffect(() => {
    fetchPosts();
    const fetchExternalJobs = async () => {
      try {
        const res = await fetch('https://remotive.com/api/remote-jobs?limit=25');
        const data = await res.json();
        if (data && data.jobs) {
          const externalJobs = data.jobs.map(j => ({
            id: `ext-${j.id}`,
            partnerId: null,
            companyName: j.company_name,
            industry: j.category || 'Information Technology',
            title: j.title,
            opportunityType: 'Job',
            ncLevel: 'Any',
            requiredCompetencies: [],
            requiredSkills: j.tags || [],
            description: j.description.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...',
            employmentType: j.job_type === 'full_time' ? 'Full-time' : 'Contract',
            location: j.candidate_required_location || 'Remote',
            salaryRange: j.salary || 'Competitive',
            slots: 1,
            status: 'Open',
            datePosted: j.publication_date.split('T')[0],
            createdAt: j.publication_date,
            isExternal: true,
            url: j.url
          }));

          setJobPostings(prev => {
            // Avoid duplicate fetches on strict mode
            const existingExt = prev.some(p => String(p.id).startsWith('ext-'));
            if (existingExt) return prev;
            return [...prev, ...externalJobs];
          });
        }
      } catch (err) {
        console.error('Failed to fetch external jobs:', err);
      }
    };
    fetchExternalJobs();
  }, []);

  // ─── ML-INSPIRED RECOMMENDATION ENGINE ────────────────────────────────────
  // Multi-factor weighted scoring with fuzzy matching and personalization

  // Tokenize and normalize text for comparison
  const tokenize = (text) => {
    if (!text) return [];
    return String(text).toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  };

  // Jaccard similarity between two token sets
  const jaccardSimilarity = (setA, setB) => {
    if (setA.length === 0 && setB.length === 0) return 1;
    if (setA.length === 0 || setB.length === 0) return 0;
    const a = new Set(setA);
    const b = new Set(setB);
    const intersection = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union > 0 ? intersection / union : 0;
  };

  // Fuzzy token match — partial word overlap (e.g. "troubleshoot" matches "troubleshooting")
  const fuzzyTokenMatch = (tokenA, tokenB) => {
    if (tokenA === tokenB) return 1;
    if (tokenA.length < 4 || tokenB.length < 4) return 0;
    const shorter = tokenA.length < tokenB.length ? tokenA : tokenB;
    const longer = tokenA.length < tokenB.length ? tokenB : tokenA;
    return longer.includes(shorter) ? 0.8 : 0;
  };

  // Count how many items in needles fuzzy-match items in haystack
  const fuzzySetOverlap = (needles, haystack) => {
    if (needles.length === 0) return 0;
    let matched = 0;
    for (const n of needles) {
      const nTokens = tokenize(n);
      for (const h of haystack) {
        const hTokens = tokenize(h);
        // Exact match
        if (n.toLowerCase() === h.toLowerCase()) { matched++; break; }
        // Token overlap
        const overlap = jaccardSimilarity(nTokens, hTokens);
        if (overlap >= 0.5) { matched += overlap; break; }
        // Fuzzy substring
        const fuzzy = nTokens.some(nt => hTokens.some(ht => fuzzyTokenMatch(nt, ht) > 0));
        if (fuzzy) { matched += 0.6; break; }
      }
    }
    return matched / needles.length;
  };

  const getMatchRate = (traineeId, jobId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!trainee || !job) return 0;

    // Factor 1: Competency match (40%)
    const compTotal = (job.requiredCompetencies || []).length;
    const traineeComps = trainee.competencies || [];
    const compScore = compTotal > 0 ? fuzzySetOverlap(job.requiredCompetencies, traineeComps) : 0;

    // Factor 2: Skills match (25%)
    const jobSkills = (job.requiredSkills || []).map(s => String(s).toLowerCase());
    const traineeSkills = (trainee.skills || []).map(s =>
      (typeof s === 'object' ? s.name : String(s)).toLowerCase()
    );
    const skillScore = jobSkills.length > 0 ? fuzzySetOverlap(jobSkills, traineeSkills) : 0;

    // Factor 3: Certification/NC Level alignment (20%)
    const traineeCerts = (trainee.certifications || []).map(c => c.toLowerCase());
    const jobNC = (job.ncLevel || '').toLowerCase();
    let certScore = 0;
    if (jobNC) {
      if (traineeCerts.some(c => c === jobNC)) certScore = 1;
      else if (traineeCerts.some(c => c.includes(jobNC.split(' ')[0]))) certScore = 0.6;
      else {
        const ncTokens = tokenize(jobNC);
        const certTokens = traineeCerts.flatMap(c => tokenize(c));
        certScore = jaccardSimilarity(ncTokens, certTokens);
      }
    }

    // Factor 4: Interest alignment (10%) — trainee interests vs job description keywords
    const traineeInterests = (trainee.interests || []).map(i => i.toLowerCase());
    const descTokens = tokenize(job.description + ' ' + job.title + ' ' + (job.industry || ''));
    let interestScore = 0;
    if (traineeInterests.length > 0 && descTokens.length > 0) {
      const interestTokens = traineeInterests.flatMap(i => tokenize(i));
      interestScore = jaccardSimilarity(interestTokens, descTokens);
    }

    // Factor 5: Recency boost (5%) — jobs posted within 30 days get full score
    let recencyScore = 0.5;
    if (job.datePosted) {
      const daysSincePosted = (Date.now() - new Date(job.datePosted).getTime()) / (1000 * 60 * 60 * 24);
      recencyScore = daysSincePosted <= 7 ? 1 : daysSincePosted <= 30 ? 0.8 : daysSincePosted <= 90 ? 0.5 : 0.2;
    }

    // Weighted combination
    const weights = { comp: 0.40, skill: 0.25, cert: 0.20, interest: 0.10, recency: 0.05 };

    // Adaptive weights: if job has no competencies, redistribute weight to skills/certs
    let activeWeights = { ...weights };
    if (compTotal === 0) {
      activeWeights.comp = 0;
      activeWeights.skill += weights.comp * 0.5;
      activeWeights.cert += weights.comp * 0.5;
    }
    if (jobSkills.length === 0) {
      activeWeights.skill = 0;
      activeWeights.comp += weights.skill * 0.6;
      activeWeights.cert += weights.skill * 0.4;
    }

    const raw = (
      activeWeights.comp * compScore +
      activeWeights.skill * skillScore +
      activeWeights.cert * certScore +
      activeWeights.interest * interestScore +
      activeWeights.recency * recencyScore
    );

    // Normalize to sum of active weights
    const totalWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);
    const normalized = totalWeight > 0 ? raw / totalWeight : 0;

    return Math.min(100, Math.max(0, Math.round(normalized * 100)));
  };

  const getGapAnalysis = (traineeId, jobId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    const job = jobPostings.find(j => j.id === jobId);
    if (!trainee || !job) return [];

    const traineeSkillNames = (trainee.skills || []).map(s =>
      (typeof s === 'object' ? s.name : s).toLowerCase()
    );

    const compGaps = (job.requiredCompetencies || []).map(comp => ({
      competency: comp,
      type: 'competency',
      status: (trainee.competencies || []).includes(comp) ? 'Matched' : 'Missing',
    }));

    const skillGaps = (job.requiredSkills || []).map(skill => ({
      competency: skill,
      type: 'skill',
      status: traineeSkillNames.includes(skill.toLowerCase()) ? 'Matched' : 'Missing',
    }));

    return [...compGaps, ...skillGaps];
  };

  const getTraineeRecommendedJobs = (traineeId) => {
    const trainee = trainees.find(t => t.id === traineeId);
    if (!trainee) return [];
    return jobPostings
      .filter(j => j.status === 'Open')
      .map(j => ({ ...j, matchRate: getMatchRate(traineeId, j.id) }))
      .sort((a, b) => b.matchRate - a.matchRate);
  };

  const applyToJob = async (traineeId, jobId) => {
    const job = jobPostings.find(j => j.id === jobId);

    // Handle external jobs
    if (job?.isExternal && job?.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
      logActivity('Link Click', 'Opportunities', `${traineeId} clicked to apply to external job: ${job.title}`);
      return { success: true, external: true };
    }

    const existing = applications.find(a => a.traineeId === traineeId && a.jobId === jobId);
    if (existing) return { success: false, error: 'Already applied to this opportunity.' };
    const trainee = trainees.find(t => t.id === traineeId);

    const isSupabaseUser = typeof traineeId === 'string' && traineeId.includes('-');

    if (isSupabaseUser) {
      const { data, error } = await supabase
        .from('applications')
        .insert({ student_id: traineeId, job_posting_id: jobId, status: 'Pending' })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      setApplications(prev => [...prev, {
        id: data.id, traineeId, jobId, status: 'Pending',
        appliedAt: data.created_at?.split('T')[0], reviewedAt: null, notes: null,
      }]);
    } else {
      const newApplication = {
        id: applications.length + 1, traineeId, jobId, status: 'Pending',
        appliedAt: new Date().toISOString().split('T')[0], reviewedAt: null, notes: null,
      };
      setApplications([...applications, newApplication]);
    }

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

  const updateTrainee = async (traineeId, updates) => {
    // For Supabase-registered users (UUID string IDs), persist to database
    const isSupabaseUser = typeof traineeId === 'string' && traineeId.includes('-');
    if (isSupabaseUser) {
      try {
        // Map dashboard field names to students table column names
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.full_name = updates.name;

        if (updates.birthday !== undefined) dbUpdates.birthdate = updates.birthday;
        if (updates.gender !== undefined) dbUpdates.gender = updates.gender?.toLowerCase();
        if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
        if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
        if (updates.employmentStatus !== undefined) {
          const statusMap = { 'Employed': 'employed', 'Unemployed': 'not_employed', 'Self-Employed': 'employed', 'Underemployed': 'employed' };
          dbUpdates.employment_status = statusMap[updates.employmentStatus] || 'not_employed';
        }
        if (updates.employer !== undefined) dbUpdates.employment_work = updates.employer;
        if (updates.jobTitle !== undefined) dbUpdates.employment_work = updates.jobTitle || dbUpdates.employment_work;
        if (updates.dateHired !== undefined) dbUpdates.employment_start = updates.dateHired || null;
        if (updates.address !== undefined) dbUpdates.detailed_address = updates.address;
        if (updates.trainingStatus !== undefined) dbUpdates.training_status = updates.trainingStatus;
        if (updates.graduationYear !== undefined) dbUpdates.graduation_year = updates.graduationYear || null;
        if (updates.photo !== undefined) dbUpdates.profile_picture_url = updates.photo;
        if (updates.bannerUrl !== undefined) dbUpdates.banner_url = updates.bannerUrl;
        if (updates.certifications !== undefined) dbUpdates.certifications = updates.certifications;
        if (updates.educHistory !== undefined) dbUpdates.educ_history = updates.educHistory;
        if (updates.workExperience !== undefined) dbUpdates.work_experience = updates.workExperience;

        if (Object.keys(dbUpdates).length > 0) {
          // If admin role, use server-side API to bypass RLS
          if (userRole === 'admin') {
            const resp = await fetch('/api/admin/update-student', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: traineeId, updates: dbUpdates }),
            });
            const result = await resp.json();
            if (!resp.ok) {
              console.error('Admin update failed:', result.error);
              alert('Failed to save: ' + result.error);
              return;
            }
          } else {
            const { error } = await supabase
              .from('students')
              .update(dbUpdates)
              .eq('id', traineeId);
            if (error) {
              console.error('Profile update failed:', error.message);
              alert('Failed to save profile: ' + error.message);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Profile update error:', err);
        alert('Unable to save profile. Please check your connection.');
        return;
      }
    } else {
      // In-memory trainees (mock data with numeric IDs)
      const existing = trainees.find(t => t.id === traineeId);
      setTrainees(trainees.map(t => t.id === traineeId ? { ...t, ...updates } : t));
      logActivity('Edit', 'Trainees', `Updated trainee: ${existing?.name}`, null, null);
    }
    // Always update currentUser in state + localStorage
    if (currentUser?.id === traineeId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
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

  // Auto-detect: use localhost for dev, relative path for Vercel production

  // ─── AUTH FUNCTIONS ──────────────────────────────────────────────────────
  const login = async (email, password) => {

    // Quick Demo Login Bypass for Admin
    if (email === 'admin' && password === 'admin123') {
      const adminUser = {
        id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        name: 'Administrator (Demo)',
        email: 'admin@pstdi.edu.ph',
        username: 'admin',
      };
      setUserRole('admin');
      setCurrentUser(adminUser);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return { success: true, role: 'admin' };
    }

    // Quick Demo Login Bypass for Partner
    if (email === 'techsolutions' && password === 'partner123') {
      const partnerUser = {
        id: 'de305d54-75b4-431b-adb2-eb6b9e546015',
        email: 'contact@techsolutions.com',
        companyName: 'TechSolutions Inc.',
        contactPerson: 'James Wilson',
        industry: 'Software Development',
        verificationStatus: 'Approved',
        photo: null,
        accountStatus: 'Active'
      };
      setUserRole('partner');
      setCurrentUser(partnerUser);
      localStorage.setItem('userRole', 'partner');
      localStorage.setItem('currentUser', JSON.stringify(partnerUser));
      return { success: true, role: 'partner' };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) return { success: false, error: authError.message };
      const userId = authData.user.id;

      // Check profile type
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (profErr || !profile) return { success: false, error: 'User profile not found.' };

      // >>> 1. ADMIN LOGIN
      if (profile.user_type === 'admin') {
        const adminUser = {
          id: userId,
          name: 'Administrator',
          email: authData.user.email,
          username: authData.user.email,
        };
        setUserRole('admin');
        setCurrentUser(adminUser);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return { success: true, role: 'admin' };
      }

      // >>> 2. PARTNER LOGIN
      if (profile.user_type === 'industry_partner') {
        const { data: partnerRec, error: partErr } = await supabase.from('industry_partners').select('*').eq('id', userId).maybeSingle();
        if (partErr || !partnerRec) return { success: false, error: 'Partner record not found.' };

        const partnerUser = {
          id: userId,
          email: authData.user.email,
          companyName: partnerRec.company_name,
          contactPerson: partnerRec.contact_person,
          industry: partnerRec.business_type || 'General',
          verificationStatus: partnerRec.verification_status === 'verified' ? 'Approved' : partnerRec.verification_status === 'rejected' ? 'Rejected' : 'Pending',
          photo: partnerRec.company_logo_url || null,
          accountStatus: 'Active'
        };

        if (partnerUser.verificationStatus === 'Rejected') {
          return { success: false, error: 'Your account has been rejected. Please contact PSTDII.' };
        }

        setUserRole('partner');
        setCurrentUser(partnerUser);
        localStorage.setItem('userRole', 'partner');
        localStorage.setItem('currentUser', JSON.stringify(partnerUser));
        return { success: true, role: 'partner' };
      }

      // >>> 3. STUDENT LOGIN
      if (profile.user_type !== 'student') {
        return { success: false, error: 'Invalid user type.' };
      }

      // Fetch student record with program name
      const { data: student, error: studentErr } = await supabase
        .from('students')
        .select('*, programs(name)')
        .eq('id', userId)
        .maybeSingle();

      if (studentErr || !student) {
        return { success: false, error: 'Student record not found.' };
      }

      // Build trainee user object for the dashboard
      const address = [student.detailed_address, student.barangay, student.city, student.province, student.region].filter(Boolean).join(', ');
      const traineeUser = {
        id: userId,
        name: student.full_name || 'Trainee',
        email: authData.user.email || '',
        username: authData.user.email || '',

        address: address || 'Philippines',
        birthday: student.birthdate || '',
        gender: student.gender || '',
        studentId: student.student_id || '',
        program: student.programs?.name || '',
        programId: student.program_id,
        graduationYear: student.graduation_year || '',
        trainingStatus: student.training_status || 'Student',
        certifications: student.certifications || [],
        educHistory: student.educ_history || [],
        workExperience: student.work_experience || [],
        competencies: [],
        skills: student.skills || [],
        interests: student.interests || [],
        employmentStatus: student.employment_status === 'employed' ? 'Employed'
          : student.employment_status === 'seeking_employment' ? 'Unemployed'
            : student.employment_status === 'not_employed' ? 'Unemployed' : 'Unemployed',
        employer: student.employment_work || null,
        jobTitle: student.employment_work || null,
        dateHired: student.employment_start || null,
        monthsAfterGraduation: null,
        photo: student.profile_picture_url || null,
        bannerUrl: student.banner_url || null,
        documents: {
          frontId: student.front_id_url || null,
          backId: student.back_id_url || null,
        },
        achievements: [],
        accountStatus: 'Active',
        certificationProgress: [],
        selfieUrl: student.selfie_url || null,
        createdAt: student.created_at || new Date().toISOString(),
      };

      setUserRole('trainee');
      setCurrentUser(traineeUser);
      localStorage.setItem('userRole', 'trainee');
      localStorage.setItem('currentUser', JSON.stringify(traineeUser));
      return { success: true, role: 'trainee' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Unable to connect to server. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
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

  // ─── Data Hydration (Supabase) ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !userRole) return;
    const isSupabaseUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    if (!isSupabaseUser) return;

    const fetchAllData = async () => {
      // 1. Fetch Jobs
      try {
        const { data: jobs } = await supabase
          .from('job_postings')
          .select('*, industry_partners(company_name)')
          .order('created_at', { ascending: false });

        if (jobs) {
          setJobPostings((prev) => {
            const exts = prev.filter(p => String(p.id).startsWith('ext-'));
            const mapped = jobs.map(j => ({
              id: j.id,
              partnerId: j.partner_id,
              companyName: j.industry_partners?.company_name || 'Company',
              industry: j.industry || 'General',
              title: j.title,
              opportunityType: j.opportunity_type || 'Job',
              ncLevel: j.nc_level || '',
              requiredCompetencies: j.required_competencies || [],
              requiredSkills: j.required_skills || [],
              description: j.description || '',
              employmentType: j.employment_type || 'Full-time',
              location: j.location || 'Philippines',
              salaryRange: j.salary_range || '',
              slots: j.slots || 1,
              status: j.status || 'Open',
              datePosted: j.created_at?.split('T')[0],
              createdAt: j.created_at,
            }));
            return [...mapped, ...exts];
          });
        }
      } catch (err) { console.warn(err); }

      // 2. Fetch all public student profiles (for feed resolution)
      try {
        const { data: stds } = await supabase
          .from('students')
          .select('id, full_name, profile_picture_url');
        if (stds) {
          setTrainees(stds.map(s => ({
            id: s.id,
            name: s.full_name,
            photo: s.profile_picture_url
          })));
        }
      } catch (err) { console.warn(err); }

      // 3. Fetch all public partner profiles (for feed resolution)
      try {
        const { data: pts } = await supabase
          .from('industry_partners')
          .select('id, company_name, company_logo_url');
        if (pts) {
          setPartners(pts.map(p => ({
            id: p.id,
            companyName: p.company_name,
            company_logo_url: p.company_logo_url
          })));
        }
      } catch (err) { console.warn(err); }

      // 4. Fetch Admin Metrics
      if (userRole === 'admin') {
        try {
          const res = await fetch(`/api/admin/data`);
          const adminData = await res.json();

          if (adminData.students) {
            const tMap = adminData.students.map(student => {
              const address = [student.detailed_address, student.barangay, student.city, student.province, student.region].filter(Boolean).join(', ');
              return {
                id: student.id,
                name: student.full_name || 'Trainee',
                email: student.email || 'None',

                address: address || 'Philippines',
                graduationYear: student.graduation_year || 'None',
                trainingStatus: student.training_status || 'Student',
                certifications: student.certifications || [],
                program: student.programs?.name || 'None',
                employmentStatus: student.employment_status === 'employed' ? 'Employed' : student.employment_status === 'seeking_employment' ? 'Seeking Employment' : 'Not Employed',
              };
            });
            console.log("Admin Data fetched mapped trainees:", tMap);
            setTrainees(tMap);
          }

          if (adminData.partners) {
            const pMap = adminData.partners.map(p => ({
              id: p.id,
              companyName: p.company_name,
              contactPerson: p.contact_person,
              industry: p.business_type || 'General',
              email: p.contact_email || '',
              verificationStatus: p.verification_status === 'verified' ? 'Approved' : p.verification_status === 'rejected' ? 'Rejected' : 'Pending',
            }));
            console.log("Admin Data fetched mapped partners:", pMap);
            setPartners(pMap);
          }
        } catch (err) {
          console.error("Failed to load admin data:", err);
        }
      }
    };

    const fetchApplications = async () => {
      // TODO: Uncomment once the 'applications' table is created in Supabase
      // try {
      //   const { data: apps, error } = await supabase
      //     .from('applications')
      //     .select('*')
      //     .eq('student_id', currentUser.id);

      //   if (error && error.code !== '42P01') {
      //     console.warn('Failed to fetch applications from Supabase:', error);
      //   }

      //   if (apps) {
      //     const mapped = apps.map(a => ({
      //       id: a.id,
      //       traineeId: a.student_id,
      //       jobId: a.job_posting_id,
      //       status: a.status || 'Pending',
      //       appliedAt: a.created_at?.split('T')[0],
      //       reviewedAt: a.reviewed_at?.split('T')[0] || null,
      //       notes: a.notes || null,
      //     }));
      //     setApplications(mapped);
      //   }
      // } catch (err) {
      //   console.warn('Exception while fetching applications:', err);
      // }
    };

    fetchAllData();
    fetchApplications();
  }, [currentUser?.id, userRole]);

  // ─── REGISTRATION DATA (multi-step persist) ──────────────────────────────
  const [registrationData, setRegistrationData] = useState({});

  // ─── ANALYTICS HELPERS ───────────────────────────────────────────────────
  const getEmploymentStats = () => {
    const total = trainees.length;
    const employed = trainees.filter(t => t.employmentStatus === 'Employed').length;
    const seeking_employment = trainees.filter(t => t.employmentStatus === 'Seeking Employment').length;
    const not_employed = trainees.filter(t => t.employmentStatus === 'Not Employed').length;

    // For backward compatibility with mock data elements still waiting to be cleared, treat 'Unemployed' and 'Self-Employed'
    const legacyEmployed = trainees.filter(t => t.employmentStatus === 'Self-Employed' || t.employmentStatus === 'Underemployed').length;
    const legacyUnemployed = trainees.filter(t => t.employmentStatus === 'Unemployed').length;

    const employmentRate = total > 0 ? Math.round(((employed + legacyEmployed) / total) * 100) : 0;

    return {
      total,
      employed: employed + legacyEmployed,
      seeking_employment: seeking_employment + legacyUnemployed,
      not_employed,
      employmentRate,
      selfEmployed: 0,
      underEmployed: 0,
      unemployed: seeking_employment + legacyUnemployed
    };
  };

  const getSkillsDemand = () => {
    const demandCount = {};
    jobPostings.filter(j => j.status === 'Open').forEach(job => {
      (job.requiredCompetencies || []).forEach(comp => {
        demandCount[comp] = (demandCount[comp] || 0) + 1;
      });
      (job.requiredSkills || []).forEach(skill => {
        demandCount[skill] = (demandCount[skill] || 0) + 1;
      });
    });
    return Object.entries(demandCount)
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
      // Registration
      registrationData,
      setRegistrationData,
      // Community Posts
      posts,
      fetchPosts,
      createPost,
    }}>
      {children}
    </AppContext.Provider>
  );
};
