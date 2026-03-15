import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const stripCompetencyCode = (value = '') => String(value)
  .replace(/^\s*[A-Z]{2,}\d+\s*[—-]\s*/i, '')
  .replace(/^\s*\d+\s*[—-]\s*/i, '')
  .replace(/^\s*[•\-*]\s*/, '')
  .trim();

const extractCompetenciesFromProgramDescription = (description = '') => {
  if (!description) return [];

  let parsedJson = null;
  try {
    parsedJson = JSON.parse(description);
  } catch (_) {
    parsedJson = null;
  }

  if (Array.isArray(parsedJson?.competencies)) {
    return parsedJson.competencies
      .map(item => stripCompetencyCode(item))
      .filter(Boolean);
  }

  const lines = String(description).split('\n');
  const markerIndex = lines.findIndex(line => /^\s*competencies\s*:?.*$/i.test(line));
  if (markerIndex < 0) return [];

  return lines
    .slice(markerIndex + 1)
    .map(line => stripCompetencyCode(line))
    .filter(Boolean);
};

const normalizeCompetencyList = (values = []) => {
  const unique = new Set();
  return (Array.isArray(values) ? values : [])
    .map(item => stripCompetencyCode(item))
    .filter(Boolean)
    .filter(item => {
      const key = item.toLowerCase();
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    });
};

const DEFAULT_STUDENT_PUBLIC_INFO_FIELDS = ['name', 'birthday', 'gender'];
const DEFAULT_PARTNER_PUBLIC_INFO_FIELDS = ['companyName', 'contactPerson', 'industry'];
const resolveVisibilityFields = (value, defaults = []) => (Array.isArray(value) ? value : defaults);

export const AppProvider = ({ children }) => {
  const appMetadata = {
    appName: 'TraineeTrack',
    orgName: 'Philippine School for Technology Development and Innovation Inc.',
    logoText: 'TT',
    currentYear: new Date().getFullYear(),
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'trainee' | 'partner'
  const presenceAccessTokenRef = useRef('');

  // ─── TRAINEES ────────────────────────────────────────────────────────────
  const [trainees, setTrainees] = useState([]);

  // ─── INDUSTRY PARTNERS ──────────────────────────────────────────────────────
  const [partners, setPartners] = useState([]);

  // ─── TESDA PROGRAMS (DB-DRIVEN) ─────────────────────────────────────────────
  const [programs, setPrograms] = useState([]);

  // ─── JOB / OPPORTUNITY POSTINGS ──────────────────────────────────────────
  const [jobPostings, setJobPostings] = useState([]);

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
      applicationMessage: 'I am interested in this role and ready for interview.',
      resumeUrl: null,
      resumeFileName: null,
      recruitMessage: null,
      recruitDocumentName: null,
      recruitDocumentUrl: null,
      recruitSentAt: null,
    },
    {
      id: 2,
      traineeId: 1,
      jobId: 2,
      status: 'Pending',
      appliedAt: '2026-02-12',
      reviewedAt: null,
      notes: null,
      applicationMessage: null,
      resumeUrl: null,
      resumeFileName: null,
      recruitMessage: null,
      recruitDocumentName: null,
      recruitDocumentUrl: null,
      recruitSentAt: null,
    },
    {
      id: 3,
      traineeId: 4,
      jobId: 1,
      status: 'Rejected',
      appliedAt: '2026-02-06',
      reviewedAt: '2026-02-11',
      notes: 'Missing required network setup competency.',
      applicationMessage: null,
      resumeUrl: null,
      resumeFileName: null,
      recruitMessage: null,
      recruitDocumentName: null,
      recruitDocumentUrl: null,
      recruitSentAt: null,
    },
  ]);

  // ─── COMMUNITY POSTS ──────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [postComments, setPostComments] = useState([]);
  const [jobPostingComments, setJobPostingComments] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);

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

  const fetchPostComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        // Graceful fallback if table is not created yet
        if (error.code === '42P01') {
          console.warn('post_comments table not found. Create it to enable comments backend.');
          return;
        }
        throw error;
      }

      setPostComments(data || []);
    } catch (err) {
      console.error('Error fetching post comments:', err);
    }
  };

  const fetchJobPostingComments = async () => {
    try {
      const { data, error } = await supabase
        .from('job_posting_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.warn('job_posting_comments table not found. Apply the migration to enable opportunity comments persistence.');
          return;
        }
        throw error;
      }

      setJobPostingComments(data || []);
    } catch (err) {
      console.error('Error fetching job posting comments:', err);
    }
  };

  const addPostComment = async (postId, content) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to comment');
      const trimmed = content?.trim();
      if (!trimmed) return { success: false, error: 'Comment cannot be empty.' };

      const payload = {
        post_id: postId,
        author_id: currentUser.id,
        author_type: userRole === 'partner' ? 'industry_partner' : 'student',
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('post_comments')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      setPostComments(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding post comment:', err);
      return { success: false, error: err.message };
    }
  };

  const getPostComments = (postId) => {
    return postComments.filter(comment => comment.post_id === postId);
  };

  const addJobPostingComment = async (jobPostingId, content) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to comment');
      const trimmed = content?.trim();
      if (!trimmed) return { success: false, error: 'Comment cannot be empty.' };

      const payload = {
        job_posting_id: jobPostingId,
        author_id: currentUser.id,
        author_type: userRole === 'partner' ? 'industry_partner' : 'student',
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('job_posting_comments')
        .insert([payload])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
          return { success: false, error: 'Opportunity comments table is not yet available. Please apply the latest Supabase migrations.' };
        }
        throw error;
      }

      setJobPostingComments(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding job posting comment:', err);
      return { success: false, error: err.message };
    }
  };

  const getJobPostingComments = (jobPostingId) => {
    return jobPostingComments.filter(comment => comment.job_posting_id === jobPostingId);
  };

  const updateJobPostingComment = async (commentId, content) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to edit comments');
      const trimmed = content?.trim();
      if (!trimmed) return { success: false, error: 'Comment cannot be empty.' };

      const { data, error } = await supabase
        .from('job_posting_comments')
        .update({ content: trimmed, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', currentUser.id)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
          return { success: false, error: 'Opportunity comments table is not yet available. Please apply the latest Supabase migrations.' };
        }
        throw error;
      }

      setJobPostingComments(prev => prev.map(comment => comment.id === commentId ? data : comment));
      return { success: true, data };
    } catch (err) {
      console.error('Error updating job posting comment:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteJobPostingComment = async (commentId) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to delete comments');

      const { error } = await supabase
        .from('job_posting_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', currentUser.id);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
          return { success: false, error: 'Opportunity comments table is not yet available. Please apply the latest Supabase migrations.' };
        }
        throw error;
      }

      setJobPostingComments(prev => prev.filter(comment => comment.id !== commentId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting job posting comment:', err);
      return { success: false, error: err.message };
    }
  };

  const sendContactRequest = async (contactData = {}) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to contact another user');

      const message = contactData.message?.trim();
      if (!message) {
        return { success: false, error: 'Message is required.' };
      }

      if (!contactData.recipientId || !contactData.recipientType) {
        return { success: false, error: 'Recipient information is missing.' };
      }

      if (contactData.recipientId === currentUser.id) {
        return { success: false, error: 'You cannot contact yourself.' };
      }

      const payload = {
        post_id: contactData.postId || null,
        job_posting_id: contactData.jobPostingId || null,
        sender_id: currentUser.id,
        sender_type: userRole === 'partner' ? 'industry_partner' : 'student',
        recipient_id: contactData.recipientId,
        recipient_type: contactData.recipientType,
        message,
        attachment_name: contactData.attachmentName || null,
        attachment_url: contactData.attachmentUrl || null,
        attachment_kind: contactData.attachmentKind || 'document',
        created_at: new Date().toISOString(),
      };

      let savedRecord = { id: `local-${Date.now()}`, ...payload };

      const { data, error } = await supabase
        .from('contact_requests')
        .insert([payload])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204') {
          console.warn('contact_requests table not found. Apply the migration to persist contact requests.');
        } else {
          throw error;
        }
      } else if (data) {
        savedRecord = data;
      }

      setContactRequests(prev => [...prev, savedRecord]);
      logActivity('Create', 'Contact', `Contact request sent to ${contactData.recipientType}`);

      return { success: true, data: savedRecord };
    } catch (err) {
      console.error('Error sending contact request:', err);
      return { success: false, error: err.message };
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

  const updatePost = async (postId, updates) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('author_id', currentUser.id)
        .select()
        .single();
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === postId ? data : p));
      return { success: true, data };
    } catch (err) {
      console.error('Error updating post:', err);
      return { success: false, error: err.message };
    }
  };

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', currentUser.id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting post:', err);
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

  useEffect(() => {
    fetchPosts();
    fetchPostComments();

    const fetchProgramsCatalog = async () => {
      try {
        let rows = null;
        let error = null;

        const primary = await supabase
          .from('programs')
          .select('id, name, nc_level, duration_hours, description, competencies')
          .order('name', { ascending: true });

        rows = primary.data;
        error = primary.error;

        if (error && (error.code === 'PGRST204' || String(error.message || '').toLowerCase().includes('competencies'))) {
          const fallback = await supabase
            .from('programs')
            .select('id, name, nc_level, duration_hours, description')
            .order('name', { ascending: true });

          rows = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;

        const mappedPrograms = (rows || []).map(program => {
          const fromColumn = normalizeCompetencyList(program.competencies || []);
          const fromDescription = extractCompetenciesFromProgramDescription(program.description || '');

          return {
            id: program.id,
            name: program.name,
            ncLevel: program.nc_level || '',
            durationHours: program.duration_hours || null,
            description: program.description || '',
            competencies: fromColumn.length > 0 ? fromColumn : fromDescription,
          };
        });

        setPrograms(mappedPrograms);
      } catch (err) {
        console.warn('Failed to fetch programs catalog:', err);
      }
    };

    fetchProgramsCatalog();
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

  const normalizeApplicationStatus = (value) => {
    const raw = String(value || 'Pending').toLowerCase();
    if (raw === 'accepted') return 'Accepted';
    if (raw === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const toDateOnly = (value) => String(value || '').split('T')[0] || null;

  const toTimestamp = (value) => {
    const ts = new Date(value || '').getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const isSchemaMissingError = (error) => ['42P01', 'PGRST205'].includes(error?.code);
  const isColumnShapeError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return ['PGRST204', '42703'].includes(error?.code) || message.includes('column');
  };

  const applyToJob = async (traineeId, jobId, applicationData = {}) => {
    const job = jobPostings.find(j => j.id === jobId);

    const existing = applications.find(a => a.traineeId === traineeId && a.jobId === jobId);
    if (existing) return { success: false, error: 'Already applied to this opportunity.' };
    const trainee = trainees.find(t => t.id === traineeId);
    const applicationMessage = applicationData.applicationMessage?.trim() || null;
    const resumeUrl = applicationData.resumeUrl || null;
    const resumeFileName = applicationData.resumeFileName || null;

    if (!resumeUrl) {
      return { success: false, error: 'Resume is required before submitting your application.' };
    }

    const isSupabaseUser = typeof traineeId === 'string' && traineeId.includes('-');

    if (isSupabaseUser) {
      const attempts = [
        {
          table: 'job_applications',
          payload: {
            student_id: traineeId,
            job_id: jobId,
            status: 'Pending',
            applied_at: new Date().toISOString(),
            applicant_message: applicationMessage,
            resume_url: resumeUrl,
            resume_file_name: resumeFileName,
          },
        },
        {
          table: 'applications',
          payload: {
            student_id: traineeId,
            job_posting_id: jobId,
            status: 'Pending',
            applicant_message: applicationMessage,
            resume_url: resumeUrl,
            resume_file_name: resumeFileName,
          },
        },
      ];

      let data = null;
      let insertedTable = null;
      let lastError = null;

      for (const attempt of attempts) {
        const result = await supabase.from(attempt.table).insert(attempt.payload).select().single();
        if (!result.error) {
          data = result.data;
          insertedTable = attempt.table;
          break;
        }

        lastError = result.error;
        if (isSchemaMissingError(result.error) || isColumnShapeError(result.error)) {
          continue;
        }

        return { success: false, error: result.error.message };
      }

      if (!data) {
        return { success: false, error: lastError?.message || 'Could not save application.' };
      }

      setApplications(prev => [...prev, {
        id: data.id, traineeId, jobId, status: 'Pending',
        appliedAt: (data.created_at || data.applied_at || '').split('T')[0] || null,
        reviewedAt: null,
        notes: null,
        applicationMessage: data.applicant_message || applicationMessage,
        resumeUrl: data.resume_url || resumeUrl,
        resumeFileName: data.resume_file_name || resumeFileName,
        recruitMessage: data.recruitment_message || null,
        recruitDocumentName: data.recruitment_document_name || null,
        recruitDocumentUrl: data.recruitment_document_url || null,
        recruitSentAt: data.recruitment_sent_at?.split('T')[0] || null,
        sourceTable: insertedTable,
      }]);
    } else {
      const newApplication = {
        id: applications.length + 1, traineeId, jobId, status: 'Pending',
        appliedAt: new Date().toISOString().split('T')[0], reviewedAt: null, notes: null,
        applicationMessage,
        resumeUrl,
        resumeFileName,
        recruitMessage: null,
        recruitDocumentName: null,
        recruitDocumentUrl: null,
        recruitSentAt: null,
      };
      setApplications(prev => [...prev, newApplication]);
    }

    logActivity('Create', 'Applications', `${trainee?.name || 'Trainee'} applied to ${job?.title || 'opportunity'}`, null, 'Pending');
    return { success: true };
  };

  const updateApplicationStatus = async (applicationId, status, notes = null) => {
    const app = applications.find(a => a.id === applicationId);
    const prevStatus = app?.status;
    const reviewedAt = new Date().toISOString().split('T')[0];

    const isSupabaseApplication = typeof applicationId === 'string' && applicationId.includes('-');
    if (isSupabaseApplication) {
      const candidateTables = app?.sourceTable ? [app.sourceTable] : ['job_applications', 'applications'];
      let persisted = false;

      for (const table of candidateTables) {
        const { error } = await supabase
          .from(table)
          .update({ status, notes, reviewed_at: new Date().toISOString() })
          .eq('id', applicationId);

        if (!error) {
          persisted = true;
          break;
        }

        if (isSchemaMissingError(error) || isColumnShapeError(error)) {
          continue;
        }

        console.warn(`Failed to update application status in Supabase (${table}):`, error);
        break;
      }

      if (!persisted) {
        console.warn('Failed to persist application status update in Supabase for id:', applicationId);
      }
    }

    setApplications(prev => prev.map(a =>
      a.id === applicationId ? { ...a, status, notes, reviewedAt } : a
    ));
    logActivity('Status Change', 'Applications', `Application #${applicationId} status changed`, prevStatus, status);
    return { success: true };
  };

  const sendRecruitMessage = async (applicationId, recruitData = {}) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return { success: false, error: 'Application not found.' };

    const recruitMessage = recruitData.recruitMessage?.trim() || '';
    const recruitDocumentName = recruitData.recruitDocumentName?.trim() || null;
    const recruitDocumentUrl = recruitData.recruitDocumentUrl?.trim() || null;

    if (!recruitMessage) {
      return { success: false, error: 'Recruitment message is required.' };
    }

    const nowIso = new Date().toISOString();

    const isSupabaseApplication = typeof applicationId === 'string' && applicationId.includes('-');
    if (isSupabaseApplication) {
      const candidateTables = app?.sourceTable ? [app.sourceTable] : ['job_applications', 'applications'];
      let persisted = false;

      for (const table of candidateTables) {
        const { error } = await supabase
          .from(table)
          .update({
            recruitment_message: recruitMessage,
            recruitment_document_name: recruitDocumentName,
            recruitment_document_url: recruitDocumentUrl,
            recruitment_sent_at: nowIso,
          })
          .eq('id', applicationId);

        if (!error) {
          persisted = true;
          break;
        }

        if (isSchemaMissingError(error) || isColumnShapeError(error)) {
          continue;
        }

        console.warn(`Failed to save recruit message in Supabase (${table}):`, error);
        break;
      }

      if (!persisted) {
        console.warn('Recruit message was not persisted in Supabase for id:', applicationId);
      }
    }

    setApplications(prev => prev.map(a =>
      a.id === applicationId
        ? {
            ...a,
            recruitMessage,
            recruitDocumentName,
            recruitDocumentUrl,
            recruitSentAt: nowIso.split('T')[0],
          }
        : a
    ));

    logActivity('Create', 'Recruit', `Recruit message sent for application #${applicationId}`);
    return { success: true };
  };

  const getTraineeApplications = (traineeId) => {
    const applicationRecords = applications
      .filter(a => String(a.traineeId) === String(traineeId))
      .map(a => {
        const job = jobPostings.find(j => String(j.id) === String(a.jobId));
        const partner = partners.find(p => String(p.id) === String(job?.partnerId));

        return {
          ...a,
          rowKey: `application-${a.id}`,
          recordType: 'application',
          activityType: 'Job Application',
          directionLabel: 'You applied',
          eventDate: a.appliedAt,
          job,
          partner: partner || (job ? { id: job.partnerId, companyName: job.companyName || 'Industry Partner' } : null),
          outgoingMessage: a.applicationMessage || null,
          incomingMessage: a.recruitMessage || a.notes || null,
          attachmentName: a.resumeFileName || null,
          attachmentUrl: a.resumeUrl || null,
          attachmentKind: a.resumeUrl ? 'resume' : null,
          sortAt: toTimestamp(a.appliedAt),
        };
      });

    const contactRecords = contactRequests
      .filter(request => String(request.sender_id) === String(traineeId) || String(request.recipient_id) === String(traineeId))
      .map(request => {
        const isOutgoing = String(request.sender_id) === String(traineeId);
        const partnerId = isOutgoing ? request.recipient_id : request.sender_id;
        const partner = partners.find(p => String(p.id) === String(partnerId));
        const jobId = request.jobPostingId || request.job_posting_id;
        const job = jobPostings.find(j => String(j.id) === String(jobId));

        return {
          id: request.id,
          rowKey: `contact-${request.id}`,
          recordType: 'contact',
          activityType: isOutgoing ? 'Direct Apply Contact' : 'Partner Contact',
          directionLabel: isOutgoing ? 'You contacted partner' : 'Partner contacted you',
          eventDate: toDateOnly(request.created_at),
          status: isOutgoing ? 'Sent' : 'Received',
          job,
          partner: partner || (job ? { id: job.partnerId, companyName: job.companyName || 'Industry Partner' } : { id: partnerId, companyName: 'Industry Partner' }),
          outgoingMessage: isOutgoing ? request.message : null,
          incomingMessage: isOutgoing ? null : request.message,
          attachmentName: request.attachment_name || null,
          attachmentUrl: request.attachment_url || null,
          attachmentKind: request.attachment_kind || null,
          sortAt: toTimestamp(request.created_at),
        };
      });

    return [...applicationRecords, ...contactRecords].sort((a, b) => b.sortAt - a.sortAt);
  };

  const getJobApplicants = (jobId) => {
    return applications.filter(a => a.jobId === jobId).map(a => {
      const trainee = trainees.find(t => t.id === a.traineeId);
      return { ...a, trainee, matchRate: getMatchRate(a.traineeId, jobId) };
    });
  };

  const getPartnerApplicants = (partnerId) => {
    const partnerJobs = jobPostings.filter(j => String(j.partnerId) === String(partnerId));

    const applicationRecords = partnerJobs.flatMap(job =>
      applications
        .filter(a => String(a.jobId) === String(job.id))
        .map(a => {
          const trainee = trainees.find(t => String(t.id) === String(a.traineeId));

          return {
            ...a,
            rowKey: `application-${a.id}`,
            recordType: 'application',
            activityType: 'Job Application',
            directionLabel: 'Student applied',
            eventDate: a.appliedAt,
            trainee,
            job,
            outgoingMessage: a.recruitMessage || null,
            incomingMessage: a.applicationMessage || null,
            attachmentName: a.resumeFileName || null,
            attachmentUrl: a.resumeUrl || null,
            attachmentKind: a.resumeUrl ? 'resume' : null,
            matchRate: getMatchRate(a.traineeId, job.id),
            sortAt: toTimestamp(a.appliedAt),
          };
        })
    );

    const contactRecords = contactRequests
      .filter(request => String(request.sender_id) === String(partnerId) || String(request.recipient_id) === String(partnerId))
      .map(request => {
        const isOutgoing = String(request.sender_id) === String(partnerId);
        const traineeId = isOutgoing ? request.recipient_id : request.sender_id;
        const trainee = trainees.find(t => String(t.id) === String(traineeId));
        const jobId = request.jobPostingId || request.job_posting_id;
        const job = jobPostings.find(j => String(j.id) === String(jobId));

        return {
          id: request.id,
          rowKey: `contact-${request.id}`,
          recordType: 'contact',
          activityType: isOutgoing ? 'Partner Outreach' : 'Student Contact',
          directionLabel: isOutgoing ? 'You contacted student' : 'Student contacted you',
          eventDate: toDateOnly(request.created_at),
          status: isOutgoing ? 'Sent' : 'Received',
          trainee,
          job,
          outgoingMessage: isOutgoing ? request.message : null,
          incomingMessage: isOutgoing ? null : request.message,
          attachmentName: request.attachment_name || null,
          attachmentUrl: request.attachment_url || null,
          attachmentKind: request.attachment_kind || null,
          matchRate: trainee?.id && job?.id ? getMatchRate(trainee.id, job.id) : null,
          sortAt: toTimestamp(request.created_at),
        };
      });

    return [...applicationRecords, ...contactRecords].sort((a, b) => b.sortAt - a.sortAt);
  };

  // ─── JOB / OPPORTUNITY FUNCTIONS ───────────────────────────────────────────
  const addJobPosting = async (jobData) => {
    const partner = partners.find(p => p.id === currentUser?.id);
    const selectedProgram = programs.find(program =>
      program.id === jobData.programId ||
      program.name === jobData.ncLevel
    );

    const selectedCompetencies = normalizeCompetencyList(selectedProgram?.competencies || []);
    const payloadCompetencies = normalizeCompetencyList(jobData.requiredCompetencies || []);

    const isSupabasePartner = typeof currentUser?.id === 'string' && currentUser.id.includes('-');

    if (isSupabasePartner) {
      try {
        const payload = {
          partnerId: currentUser?.id,
          title: jobData.title,
          opportunityType: jobData.opportunityType || 'Job',
          programId: selectedProgram?.id || jobData.programId || null,
          ncLevel: selectedProgram?.name || jobData.ncLevel || '',
          description: jobData.description || '',
          employmentType: (jobData.opportunityType || 'Job') === 'OJT' ? '' : (jobData.employmentType || ''),
          location: jobData.location || '',
          salaryRange: jobData.salaryRange || '',
          requiredCompetencies: payloadCompetencies.length > 0 ? payloadCompetencies : selectedCompetencies,
          requiredSkills: normalizeCompetencyList(jobData.requiredSkills || []),
          industry: partner?.industry || partner?.businessType || 'General',
          attachmentName: jobData.attachmentName || null,
          attachmentType: jobData.attachmentType || null,
          attachmentUrl: jobData.attachmentUrl || null,
        };

        const res = await fetch('/api/partner/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success || !json?.job) {
          return { success: false, error: json?.error || 'Failed to post opportunity.' };
        }

        setJobPostings(prev => [...prev, json.job]);
        logActivity('Create', 'Opportunities', `Posted opportunity: ${json.job.title}`, null, json.job.title);
        return { success: true, job: json.job };
      } catch (error) {
        return { success: false, error: error?.message || 'Failed to post opportunity.' };
      }
    }

    const newJob = {
      ...jobData,
      id: jobPostings.length + 1,
      partnerId: currentUser?.id,
      programId: selectedProgram?.id || jobData.programId || null,
      ncLevel: selectedProgram?.name || jobData.ncLevel || '',
      requiredCompetencies: payloadCompetencies.length > 0 ? payloadCompetencies : selectedCompetencies,
      companyName: partner?.companyName || 'Company',
      opportunityType: jobData.opportunityType || 'Job',
      employmentType: (jobData.opportunityType || 'Job') === 'OJT' ? '' : (jobData.employmentType || 'Full-time'),
      status: 'Open',
      datePosted: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setJobPostings([...jobPostings, newJob]);
    logActivity('Create', 'Opportunities', `Posted opportunity: ${newJob.title}`, null, newJob.title);
    return { success: true, job: newJob };
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
  const approvePartner = async (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    try {
      // Primary: write directly to Supabase via the client (uses authed session)
      const { error: dbErr } = await supabase
        .from('industry_partners')
        .update({ verification_status: 'verified', updated_at: new Date().toISOString() })
        .eq('id', partnerId);

      if (dbErr) {
        // Fallback: go through server API (uses service-role key, bypasses RLS)
        const res = await fetch(`/api/partner-verification/status/${partnerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'verified' })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || 'Failed to update status');
        }
      }

      // Only update UI after confirmed DB write
      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: 'Verified' } : p
      ));
      logActivity('Status Change', 'Partners', `Verified partner: ${partner?.companyName}`, partner?.verificationStatus, 'Verified');
    } catch (err) {
      console.error('Approve partner error:', err);
      alert(`Failed to approve partner: ${err.message}`);
    }
  };

  const rejectPartner = async (partnerId, reason = '') => {
    const partner = partners.find(p => p.id === partnerId);
    try {
      // Primary: write directly to Supabase via the client (uses authed session)
      const { error: dbErr } = await supabase
        .from('industry_partners')
        .update({ verification_status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', partnerId);

      if (dbErr) {
        // Fallback: go through server API (uses service-role key, bypasses RLS)
        const res = await fetch(`/api/partner-verification/status/${partnerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || 'Failed to update status');
        }
      }

      // Only update UI after confirmed DB write
      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: 'Rejected' } : p
      ));
      const reasonText = reason?.trim() ? ` (Reason: ${reason.trim()})` : '';
      logActivity('Status Change', 'Partners', `Rejected partner: ${partner?.companyName}${reasonText}`, partner?.verificationStatus, 'Rejected');
    } catch (err) {
      console.error('Reject partner error:', err);
      alert(`Failed to reject partner: ${err.message}`);
    }
  };

  const registerPartner = async (partnerData) => {
    try {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: partnerData.email,
        password: partnerData.password,
        options: {
          data: { user_type: 'industry_partner' }
        }
      });

      if (authError) {
        // This natively catches if the email is already in use
        return { success: false, error: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: 'Failed to create user account. Please try again.' };
      }

      // 2. Override default profile trigger to ensure they are an industry partner
      await supabase.from('profiles').upsert({ id: userId, user_type: 'industry_partner' });

      // 3. Insert into industry_partners table
      const { error: insertError } = await supabase.from('industry_partners').upsert({
        id: userId,
        company_name: partnerData.companyName,
        contact_person: partnerData.contactPerson,
        business_type: partnerData.industry,
        contact_email: partnerData.email,
        detailed_address: partnerData.address,
        verification_status: null
      });

      if (insertError) {
        console.error('Partner insert error:', insertError);
        return { success: false, error: 'Account created, but failed to save company details.' };
      }

      logActivity('Create', 'Partners', `New partner registered: ${partnerData.companyName}`, null, partnerData.companyName);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'An unexpected server error occurred.' };
    }
  };

  const updatePartner = async (partnerId, updates) => {
    // For Supabase-registered users (UUID string IDs), persist to database
    const isSupabaseUser = typeof partnerId === 'string' && partnerId.includes('-');
    if (isSupabaseUser) {
      try {
        // Map dashboard field names to industry_partners table column names
        const dbUpdates = {};
        if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
        if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
        if (updates.industry !== undefined) dbUpdates.business_type = updates.industry;
        if (updates.address !== undefined) {
          dbUpdates.city = updates.address; // Mapping general address to city field for now
        }
        if (updates.companySize !== undefined) dbUpdates.company_size = updates.companySize;
        if (updates.website !== undefined) dbUpdates.website = updates.website;
        if (updates.email !== undefined) dbUpdates.contact_email = updates.email;
        if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
        if (updates.benefits !== undefined) dbUpdates.benefits = updates.benefits;
        if (updates.companyInfoVisibility !== undefined) dbUpdates.company_info_visibility = updates.companyInfoVisibility;

        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase
            .from('industry_partners')
            .update(dbUpdates)
            .eq('id', partnerId);

          if (error) {
            console.error('Failed to update partner in Supabase:', error);
            alert('Failed to save to database: ' + error.message);
            return;
          }
        }
      } catch (err) {
        console.error('Supabase update error:', err);
        alert('An error occurred while saving.');
        return;
      }
    }

    // Update local state for immediate UI reflection
    setPartners(prev => prev.map(p =>
      p.id === partnerId ? { ...p, ...updates } : p
    ));
    if (currentUser?.id === partnerId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    logActivity('Edit', 'Partners', `Updated company profile`, null, null);
  };

  const submitPartnerDocuments = async (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    try {
      const res = await fetch(`/api/partner-verification/status/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' })
      });
      if (!res.ok) {
        let message = 'Failed to update status';
        try {
          const errData = await res.json();
          if (errData?.error) message = errData.error;
        } catch (_) {}
        throw new Error(message);
      }

      // Only update local state after successful DB update
      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: 'Under Review' } : p
      ));
      if (currentUser?.id === partnerId) {
        setCurrentUser(prev => ({ ...prev, verificationStatus: 'Under Review' }));
      }
      logActivity('Status Change', 'Partners', `${partner?.companyName} submitted documents for verification`, partner?.verificationStatus, 'Under Review');
    } catch (err) {
      console.error('Submit partner documents error:', err);
      alert(`Failed to submit for review: ${err.message}`);
    }
  };

  const withdrawPartnerSubmission = async (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    try {
      const res = await fetch(`/api/partner-verification/status/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: null })
      });
      if (!res.ok) {
        let message = 'Failed to withdraw submission';
        try {
          const errData = await res.json();
          if (errData?.error) message = errData.error;
        } catch (_) {}
        throw new Error(message);
      }

      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: 'Pending' } : p
      ));
      if (currentUser?.id === partnerId) {
        setCurrentUser(prev => ({ ...prev, verificationStatus: 'Pending' }));
      }
      logActivity('Status Change', 'Partners', `${partner?.companyName} withdrew verification submission`, 'Under Review', 'Pending');
    } catch (err) {
      console.error('Withdraw submission error:', err);
      alert(`Failed to withdraw submission: ${err.message}`);
    }
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
        if (updates.email !== undefined) dbUpdates.contact_email = updates.email;
        if (updates.personalInfoVisibility !== undefined) dbUpdates.personal_info_visibility = updates.personalInfoVisibility;

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
  const deleteAccount = async (accountType, accountId) => {
    const isUUID = typeof accountId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);

    if (isUUID) {
      try {
        console.log('[deleteAccount] Calling server for:', accountId, accountType);
        const res = await fetch('/api/admin/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, accountType }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = json.error || res.statusText;
          console.error('[deleteAccount] Server error:', msg);
          alert(`Failed to delete account from database:\n\n${msg}`);
          return;
        }
        console.log('[deleteAccount] Server confirmed deletion.');
      } catch (err) {
        console.error('[deleteAccount] Network error:', err);
        alert('Could not reach the server to delete the account from the database. Is the otp-server running?');
        return;
      }
    }

    if (accountType === 'trainee') {
      const existing = trainees.find(t => t.id === accountId);
      setTrainees(prev => prev.filter(t => t.id !== accountId));
      setApplications(prev => prev.filter(a => a.traineeId !== accountId));
      setPosts(prev => prev.filter(p => p.author_id !== accountId));
      setPostComments(prev => prev.filter(c => c.author_id !== accountId));
      setJobPostingComments(prev => prev.filter(c => c.author_id !== accountId));
      setContactRequests(prev => prev.filter(cr => cr.sender_id !== accountId && cr.recipient_id !== accountId));
      logActivity('Delete', 'Accounts', `Deleted student account: ${existing?.name || existing?.profileName}`, existing?.name, null);
    } else if (accountType === 'partner') {
      const existing = partners.find(p => p.id === accountId);
      const partnerJobIds = new Set(jobPostings.filter(j => j.partnerId === accountId || j.partner_id === accountId).map(j => j.id));
      setPartners(prev => prev.filter(p => p.id !== accountId));
      setJobPostings(prev => prev.filter(j => j.partnerId !== accountId && j.partner_id !== accountId));
      setApplications(prev => prev.filter(a => !partnerJobIds.has(a.jobId)));
      setPosts(prev => prev.filter(p => p.author_id !== accountId));
      setPostComments(prev => prev.filter(c => c.author_id !== accountId));
      setJobPostingComments(prev => prev.filter(c => c.author_id !== accountId && !partnerJobIds.has(c.job_posting_id)));
      setContactRequests(prev => prev.filter(cr => cr.sender_id !== accountId && cr.recipient_id !== accountId));
      logActivity('Delete', 'Accounts', `Deleted partner account: ${existing?.companyName || existing?.profileName}`, existing?.companyName, null);
    }
  };

  const updateAccountStatus = (accountType, accountId, newStatus, reason = '') => {
    const reasonText = reason?.trim() ? ` (Reason: ${reason.trim()})` : '';
    if (accountType === 'trainee') {
      const existing = trainees.find(t => t.id === accountId);
      setTrainees(trainees.map(t => t.id === accountId ? { ...t, accountStatus: newStatus } : t));
      logActivity('Status Change', 'Accounts', `${existing?.name} account status changed${reasonText}`, existing?.accountStatus, newStatus);
    } else if (accountType === 'partner') {
      const existing = partners.find(p => p.id === accountId);
      setPartners(partners.map(p => p.id === accountId ? { ...p, accountStatus: newStatus } : p));
      logActivity('Status Change', 'Accounts', `${existing?.companyName} account status changed${reasonText}`, existing?.accountStatus, newStatus);
    }
  };

  // Auto-detect: use localhost for dev, relative path for Vercel production

  // ─── AUTH FUNCTIONS ──────────────────────────────────────────────────────
  const login = async (email, password) => {

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
          verificationStatus: partnerRec.verification_status === 'verified' ? 'Verified' : partnerRec.verification_status === 'rejected' ? 'Rejected' : partnerRec.verification_status === 'under_review' ? 'Under Review' : 'Pending',
          photo: partnerRec.company_logo_url || null,
          accountStatus: 'Active',
          achievements: partnerRec.achievements || [],
          benefits: partnerRec.benefits || [],
          companyInfoVisibility: resolveVisibilityFields(partnerRec.company_info_visibility, DEFAULT_PARTNER_PUBLIC_INFO_FIELDS),
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
        name: student.full_name || student.profile_name || 'Trainee',
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
        resumeUrl: student.resume_url || null,
        registrationResumeUrl: student.resume_url || null,
        documents: {
          frontId: student.front_id_url || null,
          backId: student.back_id_url || null,
        },
        achievements: [],
        accountStatus: 'Active',
        certificationProgress: [],
        personalInfoVisibility: resolveVisibilityFields(student.personal_info_visibility, DEFAULT_STUDENT_PUBLIC_INFO_FIELDS),
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

  const updateOwnPresence = async (status = 'Online', options = {}) => {
    const { keepalive = false } = options;
    const tableName = userRole === 'partner' ? 'industry_partners' : userRole === 'trainee' ? 'students' : null;
    const userId = currentUser?.id;
    const isSupabaseUser = typeof userId === 'string' && userId.includes('-');
    if (!tableName || !isSupabaseUser) return;

    const normalizedStatus = String(status || '').toLowerCase() === 'offline' ? 'Offline' : 'Online';

    try {
      let accessToken = presenceAccessTokenRef.current;
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
        presenceAccessTokenRef.current = accessToken;
      }

      if (accessToken) {
        const resp = await fetch('/api/presence/ping', {
          method: 'POST',
          keepalive,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: normalizedStatus.toLowerCase() }),
        });

        if (resp.ok) {
          return;
        }

        const errorPayload = await resp.json().catch(() => ({}));
        console.warn('Presence API ping failed, falling back to direct update:', errorPayload?.error || resp.statusText);
      }

      const { error } = await supabase
        .from(tableName)
        .update({ activity_status: normalizedStatus, last_seen_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.warn(`Failed to update ${normalizedStatus.toLowerCase()} presence:`, error);
      }
    } catch (err) {
      console.warn(`Presence update exception (${normalizedStatus}):`, err);
    }
  };

  const logout = async () => {
    await updateOwnPresence('Offline');
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
    let disposed = false;

    const syncPresenceToken = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!disposed) {
          presenceAccessTokenRef.current = sessionData?.session?.access_token || '';
        }
      } catch (_) {}
    };

    syncPresenceToken();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      presenceAccessTokenRef.current = session?.access_token || '';
    });

    return () => {
      disposed = true;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedUser = localStorage.getItem('currentUser');
    if (savedRole && savedUser) {
      setUserRole(savedRole);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const tableName = userRole === 'partner' ? 'industry_partners' : userRole === 'trainee' ? 'students' : null;
    const userId = currentUser?.id;
    const isSupabaseUser = typeof userId === 'string' && userId.includes('-');

    if (!tableName || !isSupabaseUser) return;

    let disposed = false;

    const touchOnline = async () => {
      try {
        await updateOwnPresence('Online');
      } catch (err) {
        if (!disposed) {
          console.warn('Presence heartbeat exception:', err);
        }
      }
    };

    touchOnline();

    const heartbeatId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      touchOnline();
    }, 15000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        touchOnline();
      }
    };

    const handlePageExit = () => {
      const accessToken = presenceAccessTokenRef.current;
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && accessToken) {
        const payload = JSON.stringify({ status: 'offline', token: accessToken });
        const blob = new Blob([payload], { type: 'application/json' });
        const queued = navigator.sendBeacon('/api/presence/ping', blob);
        if (queued) {
          return;
        }
      }

      updateOwnPresence('Offline', { keepalive: true });
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageExit);
      window.addEventListener('beforeunload', handlePageExit);
    }

    return () => {
      disposed = true;
      clearInterval(heartbeatId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageExit);
        window.removeEventListener('beforeunload', handlePageExit);
      }
    };
  }, [currentUser?.id, userRole]);

  // ─── Data Hydration (Supabase) ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !userRole) return;
    const isSupabaseUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    if (!isSupabaseUser) return;

    let adminRefreshTimeout = null;

    const fetchAdminDirectoryData = async () => {
      if (userRole !== 'admin') return;

      try {
        const res = await fetch(`/api/admin/data`);
        const raw = await res.text();
        let adminData = {};
        try {
          adminData = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(`Admin data endpoint returned non-JSON response (status ${res.status}).`);
        }

        if (!res.ok) {
          throw new Error(adminData.error || `Failed to load admin data (status ${res.status}).`);
        }

        if (adminData.students) {
          const tMap = adminData.students.map(student => {
            const address = [student.detailed_address, student.barangay, student.city, student.province, student.region].filter(Boolean).join(', ');
            return {
              id: student.id,
              profileName: student.profile_name || student.full_name || 'Trainee',
              name: student.profile_name || student.full_name || 'Trainee',
              email: student.email || 'None',
              activityStatus: student.activity_status || 'Offline',
              lastSeenAt: student.last_seen_at || null,

              address: address || 'Philippines',
              graduationYear: student.graduation_year || 'None',
              trainingStatus: student.training_status || 'Student',
              certifications: student.certifications || [],
              program: student.programs?.name || 'None',
              employmentStatus: student.employment_status === 'employed' ? 'Employed' : student.employment_status === 'seeking_employment' ? 'Seeking Employment' : 'Not Employed',
              employer: student.employment_work || null,
              jobTitle: student.employment_work || null,
              dateHired: student.employment_start || null,
              accountStatus: student.account_status || 'Active',
              personalInfoVisibility: resolveVisibilityFields(student.personal_info_visibility, DEFAULT_STUDENT_PUBLIC_INFO_FIELDS),
            };
          });
          console.log("Admin Data fetched mapped trainees:", tMap);
          setTrainees(tMap);
        }

        if (adminData.partners) {
          const submittedPartnerIds = new Set(adminData.submittedPartnerIds || []);
          const pMap = adminData.partners.map(p => ({
            verificationStatus: p.verification_status === 'verified'
              ? 'Verified'
              : p.verification_status === 'rejected'
                ? 'Rejected'
                : ((p.verification_status === 'pending' && submittedPartnerIds.has(p.id)) || p.verification_status === 'under_review')
                  ? 'Under Review'
                  : 'Pending',
            id: p.id,
            profileName: p.profile_name || p.company_name || 'Industry Partner',
            companyName: p.company_name,
            contactPerson: p.contact_person,
            industry: p.business_type || 'General',
            email: p.email || 'None',
            contactEmail: p.contact_email || '',
            activityStatus: p.activity_status || 'Offline',
            lastSeenAt: p.last_seen_at || null,
            achievements: p.achievements || [],
            benefits: p.benefits || [],
            accountStatus: p.account_status || 'Active',
            companyInfoVisibility: resolveVisibilityFields(p.company_info_visibility, DEFAULT_PARTNER_PUBLIC_INFO_FIELDS),
          }));
          console.log("Admin Data fetched mapped partners:", pMap);
          setPartners(pMap);
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      }
    };

    const isPresenceOnlyPayload = (payload) => {
      if (payload?.eventType !== 'UPDATE' || !payload?.new) return false;

      const changedKeys = Object.keys(payload.new).filter(key => {
        if (!payload.old) return true; // Treat as changed if old data is missing
        return payload.new[key] !== payload.old[key];
      });
      
      if (changedKeys.length === 0) return false;

      const allowedKeys = new Set(['activity_status', 'last_seen_at', 'updated_at']);
      return changedKeys.every(key => allowedKeys.has(key));
    };

    const applyAdminPresenceUpdate = (tableName, payload) => {
      const recordId = payload?.new?.id || payload?.old?.id;
      if (!recordId) return;

      const nextActivityStatus = payload?.new?.activity_status || payload?.old?.activity_status || 'Offline';
      const nextLastSeenAt = payload?.new?.last_seen_at || payload?.old?.last_seen_at || null;

      if (tableName === 'students') {
        setTrainees(prev => prev.map(student => (
          student.id === recordId
            ? { ...student, activityStatus: nextActivityStatus, lastSeenAt: nextLastSeenAt }
            : student
        )));
        return;
      }

      if (tableName === 'industry_partners') {
        setPartners(prev => prev.map(partner => (
          partner.id === recordId
            ? { ...partner, activityStatus: nextActivityStatus, lastSeenAt: nextLastSeenAt }
            : partner
        )));
      }
    };

    const fetchAllData = async () => {
      // Keep comments synced for community feed actions
      await fetchPostComments();
      await fetchJobPostingComments();

      let publicDirectory = { students: [], partners: [] };
      if (userRole !== 'admin') {
        try {
          const response = await fetch('/api/public-directory');
          if (response.ok) {
            const payload = await response.json();
            publicDirectory = {
              students: Array.isArray(payload?.students) ? payload.students : [],
              partners: Array.isArray(payload?.partners) ? payload.partners : [],
            };
          }
        } catch (err) {
          console.warn('Failed to fetch public directory fallback:', err);
        }
      }

      // 0. Fetch TESDA Programs catalog (with competencies)
      try {
        let rows = null;
        let error = null;

        const primary = await supabase
          .from('programs')
          .select('id, name, nc_level, duration_hours, description, competencies')
          .order('name', { ascending: true });

        rows = primary.data;
        error = primary.error;

        if (error && (error.code === 'PGRST204' || String(error.message || '').toLowerCase().includes('competencies'))) {
          const fallback = await supabase
            .from('programs')
            .select('id, name, nc_level, duration_hours, description')
            .order('name', { ascending: true });

          rows = fallback.data;
          error = fallback.error;
        }

        if (!error && rows) {
          setPrograms(rows.map(program => ({
            id: program.id,
            name: program.name,
            ncLevel: program.nc_level || '',
            durationHours: program.duration_hours || null,
            description: program.description || '',
            competencies: (() => {
              const fromColumn = normalizeCompetencyList(program.competencies || []);
              if (fromColumn.length > 0) return fromColumn;
              return extractCompetenciesFromProgramDescription(program.description || '');
            })(),
          })));
        }
      } catch (err) {
        console.warn('Failed to fetch programs in session hydration:', err);
      }

      // 1. Fetch Jobs
      try {
        const { data: jobs } = await supabase
          .from('job_postings')
          .select('*, industry_partners(company_name), programs(name, competencies, description)')
          .order('created_at', { ascending: false });

        if (jobs) {
          setJobPostings(jobs.map(j => ({
              ...(j.source === 'partner' && (j.attachment_url || j.source_url)
                ? {
                    attachmentUrl: j.attachment_url || j.source_url,
                    attachmentName: j.attachment_name || decodeURIComponent(String(j.attachment_url || j.source_url).split('/').pop()?.split('?')[0] || ''),
                    attachmentType: j.attachment_type || null,
                  }
                : {}),
              id: j.id,
              partnerId: j.partner_id,
              companyName: j.industry_partners?.company_name || 'Company',
              industry: j.industry || 'General',
              title: j.title,
              opportunityType: j.opportunity_type || 'Job',
              ncLevel: j.nc_level || j.programs?.name || '',
              requiredCompetencies: normalizeCompetencyList(
                (j.required_competencies && j.required_competencies.length > 0)
                  ? j.required_competencies
                  : (j.programs?.competencies?.length > 0
                    ? j.programs.competencies
                    : extractCompetenciesFromProgramDescription(j.programs?.description || ''))
              ),
              requiredSkills: j.required_skills || [],
              description: j.description || '',
              employmentType: (() => {
                if (j.opportunity_type === 'OJT') return '';
                const rawType = String(j.employment_type || '').toLowerCase();
                if (rawType === 'full_time' || rawType === 'full-time' || rawType === 'fulltime') return 'Full-time';
                if (rawType === 'part_time' || rawType === 'part-time' || rawType === 'parttime') return 'Part-time';
                if (rawType === 'contract') return 'Contract';
                if (rawType === 'internship') return 'Internship';
                return j.employment_type || 'Full-time';
              })(),
              location: j.location || 'Philippines',
              salaryRange: j.salary_range || '',
              slots: j.slots || 1,
              status: j.status || 'Open',
              datePosted: j.created_at?.split('T')[0],
              createdAt: j.created_at,
            })));
        }
      } catch (err) { console.warn(err); }

      // 2. Fetch all public student profiles (for feed resolution)
      try {
        let stds = null;
        let studentsError = null;

        const withProfileName = await supabase
          .from('students')
          .select('id, full_name, profile_name, profile_picture_url, contact_email, resume_url, personal_info_visibility');
        stds = withProfileName.data;
        studentsError = withProfileName.error;

        if (studentsError && (studentsError.code === 'PGRST204' || studentsError.code === '42703' || String(studentsError.message || '').toLowerCase().includes('profile_name'))) {
          const fallback = await supabase
            .from('students')
            .select('id, full_name, profile_picture_url, contact_email, resume_url');
          stds = fallback.data;
          studentsError = fallback.error;
        }

        if (studentsError) {
          console.warn('Direct students query failed, using public directory fallback only:', studentsError);
          stds = [];
        }

        const mergedStudents = new Map(
          (publicDirectory.students || []).map(student => ([
            student.id,
            {
              id: student.id,
              name: student.name || student.profileName || 'Trainee',
              profileName: student.profileName || student.name || 'Trainee',
              photo: student.photo || null,
              trainingStatus: student.trainingStatus || 'Student',
              personalInfoVisibility: resolveVisibilityFields(student.personalInfoVisibility, DEFAULT_STUDENT_PUBLIC_INFO_FIELDS),
              email: '',
              resumeUrl: null,
            },
          ]))
        );

        (stds || []).forEach(student => {
          const previous = mergedStudents.get(student.id) || {};
          mergedStudents.set(student.id, {
            ...previous,
            id: student.id,
            name: student.full_name || student.profile_name || previous.name || 'Trainee',
            profileName: student.profile_name || student.full_name || previous.profileName || 'Trainee',
            photo: student.profile_picture_url || previous.photo || null,
            personalInfoVisibility: resolveVisibilityFields(student.personal_info_visibility, previous.personalInfoVisibility || DEFAULT_STUDENT_PUBLIC_INFO_FIELDS),
            email: student.contact_email || previous.email || '',
            resumeUrl: student.resume_url || previous.resumeUrl || null,
          });
        });

        setTrainees(Array.from(mergedStudents.values()));
      } catch (err) { console.warn(err); }

      // 3. Fetch all public partner profiles (for feed resolution)
      try {
        let submittedPartnerIds = new Set();
        try {
          const { data: submittedRows } = await supabase
            .from('partner_verifications')
            .select('partner_id');
          if (submittedRows) {
            submittedPartnerIds = new Set(submittedRows.map(row => row.partner_id));
          }
        } catch (submissionErr) {
          console.warn('Failed to fetch partner verification submissions:', submissionErr);
        }

        const { data: pts } = await supabase
          .from('industry_partners')
          .select('*');

        const mergedPartners = new Map(
          (publicDirectory.partners || []).map(partner => ([
            partner.id,
            {
              id: partner.id,
              companyName: partner.companyName || partner.profileName || 'Industry Partner',
              profileName: partner.profileName || partner.companyName || 'Industry Partner',
              industry: partner.industry || 'General',
              company_logo_url: partner.company_logo_url || null,
              companyInfoVisibility: resolveVisibilityFields(partner.companyInfoVisibility, DEFAULT_PARTNER_PUBLIC_INFO_FIELDS),
              contactPerson: '',
              email: '',
              address: '',
              website: '',
              achievements: [],
              benefits: [],
              verificationStatus: partner.verificationStatus || 'Pending',
            },
          ]))
        );

        (pts || []).forEach(partner => {
          const previous = mergedPartners.get(partner.id) || {};
          mergedPartners.set(partner.id, {
            ...previous,
            id: partner.id,
            companyName: partner.company_name || previous.companyName || 'Industry Partner',
            profileName: previous.profileName || partner.company_name || partner.contact_person || 'Industry Partner',
            companyInfoVisibility: resolveVisibilityFields(partner.company_info_visibility, previous.companyInfoVisibility || DEFAULT_PARTNER_PUBLIC_INFO_FIELDS),
            contactPerson: partner.contact_person || previous.contactPerson || '',
            industry: partner.business_type || previous.industry || 'General',
            email: partner.contact_email || previous.email || '',
            address: partner.city || previous.address || '',
            website: partner.website || previous.website || '',
            company_logo_url: partner.company_logo_url || previous.company_logo_url || null,
            achievements: partner.achievements || previous.achievements || [],
            benefits: partner.benefits || previous.benefits || [],
            verificationStatus: partner.verification_status === 'verified'
              ? 'Verified'
              : partner.verification_status === 'rejected'
                ? 'Rejected'
                : ((partner.verification_status === 'pending' && submittedPartnerIds.has(partner.id)) || partner.verification_status === 'under_review')
                  ? 'Under Review'
                  : (previous.verificationStatus || 'Pending'),
          });
        });

        setPartners(Array.from(mergedPartners.values()));
      } catch (err) { console.warn(err); }

      // 4. Fetch Admin Metrics
      if (userRole === 'admin') {
        await fetchAdminDirectoryData();
      }
    };

    const fetchApplications = async () => {
      try {
        const isSupabaseUser = typeof currentUser?.id === 'string' && currentUser.id.includes('-');
        if (!isSupabaseUser) return;

        const combinedApps = [];
        const sources = [
          { table: 'job_applications', orderColumn: 'applied_at' },
        ];

        for (const source of sources) {
          const { data, error } = await supabase
            .from(source.table)
            .select('*')
            .order(source.orderColumn, { ascending: false });

          if (error) {
            if (!isSchemaMissingError(error)) {
              console.warn(`Failed to fetch ${source.table} from Supabase:`, error);
            }
            continue;
          }

          combinedApps.push(...(data || []).map(row => ({ ...row, __sourceTable: source.table })));
        }

        const mapped = combinedApps
          .filter(a => (a.student_id || a.trainee_id) && (a.job_posting_id || a.job_id))
          .map(a => ({
            id: a.id,
            traineeId: a.student_id || a.trainee_id,
            jobId: a.job_posting_id || a.job_id,
            status: normalizeApplicationStatus(a.status),
            appliedAt: (a.created_at || a.applied_at || '').split('T')[0] || null,
            reviewedAt: a.reviewed_at ? a.reviewed_at.split('T')[0] : null,
            notes: a.notes || null,
            applicationMessage: a.applicant_message || a.application_message || null,
            resumeUrl: a.resume_url || null,
            resumeFileName: a.resume_file_name || null,
            recruitMessage: a.recruitment_message || a.recruiter_message || null,
            recruitDocumentName: a.recruitment_document_name || a.recruiter_document_name || null,
            recruitDocumentUrl: a.recruitment_document_url || a.recruiter_document_url || null,
            recruitSentAt: a.recruitment_sent_at ? a.recruitment_sent_at.split('T')[0] : null,
            sourceTable: a.__sourceTable || null,
          }));

        setApplications(mapped);
      } catch (err) {
        console.warn('Exception while fetching applications:', err);
      }
    };

    const fetchContactRequests = async () => {
      try {
        const isSupabaseUser = typeof currentUser?.id === 'string' && currentUser.id.includes('-');
        if (!isSupabaseUser || userRole === 'admin') return;

        const { data, error } = await supabase
          .from('contact_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (isSchemaMissingError(error) || isColumnShapeError(error)) {
            console.warn('contact_requests table not found. Apply the migration to persist contact requests.');
            return;
          }

          throw error;
        }

        setContactRequests(data || []);
      } catch (err) {
        console.warn('Exception while fetching contact requests:', err);
      }
    };

    fetchAllData();
    fetchApplications();
    fetchContactRequests();

    const commentsRealtimeChannel = supabase
      .channel(`post-comments-sync-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPostComments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posting_comments' }, fetchJobPostingComments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, fetchContactRequests)
      .subscribe();

    if (userRole !== 'admin') {
      return () => {
        if (adminRefreshTimeout) clearTimeout(adminRefreshTimeout);
        supabase.removeChannel(commentsRealtimeChannel);
      };
    }

    const runAdminRefresh = () => {
      fetchAllData();
      fetchApplications();
    };

    const scheduleAdminRefresh = () => {
      if (adminRefreshTimeout) clearTimeout(adminRefreshTimeout);
      adminRefreshTimeout = setTimeout(() => {
        runAdminRefresh();
      }, 100); // Reduce debounce for faster non-presence updates
    };

    const adminRealtimeChannel = supabase
      .channel(`admin-live-sync-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        if (isPresenceOnlyPayload(payload)) {
          applyAdminPresenceUpdate('students', payload);
          return;
        }
        scheduleAdminRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry_partners' }, (payload) => {
        if (isPresenceOnlyPayload(payload)) {
          applyAdminPresenceUpdate('industry_partners', payload);
          return;
        }
        scheduleAdminRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_verifications' }, scheduleAdminRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_postings' }, scheduleAdminRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, scheduleAdminRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, scheduleAdminRefresh)
      .subscribe();

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAdminDirectoryData();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      if (adminRefreshTimeout) clearTimeout(adminRefreshTimeout);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      supabase.removeChannel(adminRealtimeChannel);
      supabase.removeChannel(commentsRealtimeChannel);
    };
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
      // Trainees
      trainees,
      addTrainee,
      updateTrainee,
      updatePartner,
      deleteTrainee,
      deleteAccount,
      // Partners
      partners,
      approvePartner,
      rejectPartner,
      registerPartner,
      submitPartnerDocuments,
      withdrawPartnerSubmission,
      // Opportunities
      programs,
      jobPostings,
      addJobPosting,
      updateJobPosting,
      deleteJobPosting,
      // Applications
      applications,
      applyToJob,
      updateApplicationStatus,
      sendRecruitMessage,
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
      postComments,
      jobPostingComments,
      contactRequests,
      fetchPosts,
      fetchPostComments,
      fetchJobPostingComments,
      createPost,
      updatePost,
      deletePost,
      addPostComment,
      getPostComments,
      addJobPostingComment,
      getJobPostingComments,
      updateJobPostingComment,
      deleteJobPostingComment,
      sendContactRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
};
