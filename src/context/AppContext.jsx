import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
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
  } catch {  
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

const DEFAULT_STUDENT_PUBLIC_INFO_FIELDS = ['name', 'birthday', 'gender', 'program'];
const DEFAULT_PARTNER_PUBLIC_INFO_FIELDS = ['companyName', 'contactPerson', 'industry'];
const resolveVisibilityFields = (value, defaults = []) => (Array.isArray(value) ? value : defaults);

const SALARY_SYMBOL_BY_CURRENCY = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const toSalaryNumber = (value) => {
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
    .trim();

  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const toSalaryCurrency = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return 'PHP';
  return SALARY_SYMBOL_BY_CURRENCY[normalized] ? normalized : 'PHP';
};

const formatSalaryAmount = (value, currency = 'PHP') => {
  const parsed = toSalaryNumber(value);
  if (!parsed) return '';
  const symbol = SALARY_SYMBOL_BY_CURRENCY[toSalaryCurrency(currency)] || '₱';
  return `${symbol}${Math.round(parsed).toLocaleString('en-US')}`;
};

const buildSalaryRangeText = (salaryRange, salaryMin, salaryMax, salaryCurrency = 'PHP') => {
  const existing = String(salaryRange || '').trim();
  if (existing) return existing;

  const minimum = toSalaryNumber(salaryMin);
  const maximum = toSalaryNumber(salaryMax);
  const currency = toSalaryCurrency(salaryCurrency);

  if (minimum && maximum) {
    return `${formatSalaryAmount(minimum, currency)} - ${formatSalaryAmount(maximum, currency)}`;
  }
  if (minimum) return `${formatSalaryAmount(minimum, currency)}+`;
  if (maximum) return `Up to ${formatSalaryAmount(maximum, currency)}`;

  return '';
};

const normalizeNcLevelValue = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const upper = raw.toUpperCase();
  if (upper.includes('NC IV') || /\bNC\s*4\b/.test(upper)) return 'NC IV';
  if (upper.includes('NC III') || /\bNC\s*3\b/.test(upper)) return 'NC III';
  if (upper.includes('NC II') || /\bNC\s*2\b/.test(upper)) return 'NC II';
  if (upper.includes('NC I') || /\bNC\s*1\b/.test(upper)) return 'NC I';

  return '';
};

const normalizeGender = (value = '') => {
  const g = String(value || '').toLowerCase().trim();
  if (g.startsWith('m')) return 'Male';
  if (g.startsWith('f')) return 'Female';
  if (g) return 'Other';
  return '';
};

const extractProgramNameFromStudentRecord = (student = null) => {
  if (!student) return '';

  const relationProgram = Array.isArray(student.programs)
    ? student.programs[0]?.name
    : student.programs?.name;

  return String(student.program || student.program_name || relationProgram || '').trim();
};

const resolveProgramNameFromStudentRecord = async (student = null) => {
  const directProgram = extractProgramNameFromStudentRecord(student);
  if (directProgram) return directProgram;

  const resolveProgramById = async (programId) => {
    if (!programId) return '';
    const { data: programRow, error: programErr } = await supabase
      .from('programs')
      .select('name')
      .eq('id', programId)
      .maybeSingle();

    if (programErr) {
      console.warn('Failed to resolve program name by id:', programErr);
      return '';
    }

    return String(programRow?.name || '').trim();
  };

  const existingProgramId = student?.program_id || student?.programId;
  const fromExistingProgramId = await resolveProgramById(existingProgramId);
  if (fromExistingProgramId) return fromExistingProgramId;

  if (!student?.id) return '';

  const { data: studentRow, error: studentErr } = await supabase
    .from('students')
    .select('id, program_id, programs(name)')
    .eq('id', student.id)
    .maybeSingle();

  if (studentErr || !studentRow) {
    if (studentErr) {
      console.warn('Failed to refresh student program mapping:', studentErr);
    }
    return '';
  }

  const relationProgram = extractProgramNameFromStudentRecord(studentRow);
  if (relationProgram) return relationProgram;

  return resolveProgramById(studentRow.program_id);
};

export const AppProvider = ({ children }) => {
  const appMetadata = {
    appName: 'TraineeTrack',
    orgName: 'Philippine School for Technology Development and Innovation Inc.',
    logoText: 'TT',
    logoUrl: '/src/assets/traineetrack_logo.svg',
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

  // ─── INTERVIEW SCHEDULING ──────────────────────────────────────────────
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [interviewBookings, setInterviewBookings] = useState([]);

  const fetchAvailability = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from('partner_availability')
        .select('*')
        .eq('partner_id', partnerId)
        .order('day_of_week', { ascending: true });
      if (error) {
        if (error.code === '42P01') { console.warn('partner_availability table not found.'); return; }
        throw error;
      }
      setAvailabilitySlots(data || []);
    } catch (err) { console.error('Error fetching availability:', err); }
  };

  const saveAvailabilitySlot = async (partnerId, slot) => {
    try {
      const payload = { partner_id: partnerId, day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time };
      const { data, error } = await supabase.from('partner_availability').insert([payload]).select().single();
      if (error) {
        if (error.code === '42P01') return { success: false, error: 'Table not found. Run the migration SQL.' };
        throw error;
      }
      setAvailabilitySlots(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) { console.error('Error saving availability:', err); return { success: false, error: err.message }; }
  };

  const deleteAvailabilitySlot = async (slotId) => {
    try {
      const { error } = await supabase.from('partner_availability').delete().eq('id', slotId);
      if (error) throw error;
      setAvailabilitySlots(prev => prev.filter(s => s.id !== slotId));
      return { success: true };
    } catch (err) { console.error('Error deleting availability:', err); return { success: false, error: err.message }; }
  };

  const fetchBookings = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from('interview_bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .order('start_time', { ascending: true });
      if (error) {
        if (error.code === '42P01') { console.warn('interview_bookings table not found.'); return; }
        throw error;
      }
      setInterviewBookings(data || []);
    } catch (err) { console.error('Error fetching bookings:', err); }
  };

  const fetchTraineeBookings = async (traineeId) => {
    try {
      const { data, error } = await supabase
        .from('interview_bookings')
        .select('*')
        .eq('trainee_id', traineeId)
        .order('start_time', { ascending: true });
      if (error) {
        if (error.code === '42P01') { console.warn('interview_bookings table not found.'); return; }
        throw error;
      }
      setInterviewBookings(data || []);
    } catch (err) { console.error('Error fetching trainee bookings:', err); }
  };

  const saveInterviewBooking = async (bookingData) => {
    try {
      const payload = {
        application_id: bookingData.application_id || bookingData.applicationId,
        trainee_id: bookingData.trainee_id || bookingData.traineeId,
        partner_id: bookingData.partner_id || bookingData.partnerId,
        start_time: bookingData.start_time || bookingData.startTime,
        end_time: bookingData.end_time || bookingData.endTime,
        status: 'scheduled',
      };
      const { data, error } = await supabase.from('interview_bookings').insert([payload]).select().single();
      if (error) {
        if (error.code === '42P01') return { success: false, error: 'Table not found. Run the migration SQL.' };
        throw error;
      }
      setInterviewBookings(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) { console.error('Error creating booking:', err); return { success: false, error: err.message }; }
  };

  const getPartnerAvailability = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from('partner_availability')
        .select('*')
        .eq('partner_id', partnerId)
        .order('day_of_week', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    } catch (err) { console.error('Error fetching partner availability:', err); return []; }
  };

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

      const authorType = userRole === 'partner' ? 'industry_partner' : 'student';

      const newPost = {
        author_id: currentUser.id,
        author_type: authorType,
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

  // Admin-only: delete any post regardless of author (for bulletin management)
  const adminDeletePost = async (postId) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      logActivity('Delete', 'Bulletin', `Deleted bulletin post ${postId}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting post (admin):', err);
      return { success: false, error: err.message };
    }
  };

  // Admin-only: update any post regardless of author
  const adminUpdatePost = async (postId, updates) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single();
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === postId ? data : p));
      logActivity('Edit', 'Bulletin', `Updated bulletin post: ${updates.title || postId}`);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating post (admin):', err);
      return { success: false, error: err.message };
    }
  };

  // ─── POST INTERACTIONS ────────────────────────────────────────────────────
  const [postInteractions, setPostInteractions] = useState([]);

  const fetchPostInteractions = async (postId = null) => {
    try {
      let query = supabase.from('post_interactions').select('*').order('created_at', { ascending: false });
      if (postId) query = query.eq('post_id', postId);
      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01') { console.warn('post_interactions table not found. Run migrations.'); return; }
        throw error;
      }
      setPostInteractions(data || []);
    } catch (err) {
      console.error('Error fetching post interactions:', err);
    }
  };

  const createPostInteraction = async (postId, interactionType, details = {}) => {
    try {
      if (!currentUser) throw new Error('You must be logged in.');

      // For 'save' interaction, check if it already exists to toggle it
      if (interactionType === 'save') {
        const existing = postInteractions.find(i => i.post_id === postId && i.user_id === currentUser.id && i.interaction_type === 'save');
        if (existing) {
          const { error } = await supabase.from('post_interactions').delete().eq('id', existing.id);
          if (!error) {
            setPostInteractions(prev => prev.filter(i => i.id !== existing.id));
            return { success: true, action: 'removed' };
          }
          throw error;
        }
      }

      const userName = currentUser.name || currentUser.companyName || (userRole === 'admin' ? 'Admin' : 'Unknown');
      
      const payload = {
        post_id: postId,
        user_id: currentUser.id,
        user_type: userRole === 'partner' ? 'industry_partner' : 'student',
        interaction_type: interactionType,
        status: 'pending',
        details: { ...details, user_name: userName },
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('post_interactions').insert([payload]).select().single();
      if (error) {
        if (error.code === '42P01') return { success: false, error: 'post_interactions table not found. Run migrations.' };
        throw error;
      }
      setPostInteractions(prev => [data, ...prev]);
      return { success: true, data, action: 'added' };
    } catch (err) {
      console.error('Error creating post interaction:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePostInteractionStatus = async (interactionId, status) => {
    try {
      const { data, error } = await supabase
        .from('post_interactions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', interactionId)
        .select()
        .single();
      if (error) throw error;
      setPostInteractions(prev => prev.map(i => i.id === interactionId ? data : i));
      logActivity('Status Change', 'Bulletin', `Interaction ${interactionId} set to ${status}`);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating interaction status:', err);
      return { success: false, error: err.message };
    }
  };

  const getPostInteractions = (postId, type = null) => {
    return postInteractions.filter(i =>
      i.post_id === postId && (type ? i.interaction_type === type : true)
    );
  };

  const getUserPostInteraction = (postId, interactionType) => {
    if (!currentUser) return null;
    return postInteractions.find(i =>
      i.post_id === postId && i.user_id === currentUser.id && i.interaction_type === interactionType
    ) || null;
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
  // Hybrid cold-start ranker with explainable signals and ML-ready metadata

  const RECOMMENDER_ENGINE_VERSION = 'hybrid-coldstart-v1';
  const RECOMMENDER_BASE_WEIGHTS = {
    competency: 0.35,
    skill: 0.18,
    ncLevel: 0.15,
    interest: 0.10,
    location: 0.07,
    partnerQuality: 0.10,
    recency: 0.05,
  };

  // Tokenize and normalize text for comparison
  const tokenize = (text) => {
    if (!text) return [];
    return String(text).toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  };

  const normalizeLooseText = (value = '') => String(value).trim().toLowerCase();

  const normalizeProgramText = (value = '') => String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

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

  const getJobTimestamp = (job) => {
    const raw = job?.createdAt || job?.created_at || job?.datePosted || null;
    const ts = new Date(raw || '').getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const getTraineeProgramCompetencies = (trainee) => {
    if (!trainee) return [];

    const direct = normalizeCompetencyList(trainee.competencies || []);
    if (direct.length > 0) return direct;

    const programById = programs.find(program => String(program.id) === String(trainee.programId));
    if (programById?.competencies?.length > 0) {
      return normalizeCompetencyList(programById.competencies);
    }

    const traineeProgramKey = normalizeProgramText(trainee.program || '');
    if (!traineeProgramKey) return [];

    const programByName = programs.find(program => normalizeProgramText(program.name || '') === traineeProgramKey);
    return normalizeCompetencyList(programByName?.competencies || []);
  };

  const getNCLAlignmentScore = (trainee, job) => {
    const jobNC = normalizeLooseText(job?.ncLevel || '');
    if (!jobNC) return 0;

    const traineeProgramNC = normalizeLooseText(trainee?.program || '');
    const traineeCerts = (trainee?.certifications || []).map(cert =>
      normalizeLooseText(typeof cert === 'object' ? cert.name : cert)
    );

    if (traineeProgramNC && traineeProgramNC === jobNC) return 1;
    if (traineeCerts.some(cert => cert === jobNC)) return 1;

    if (traineeProgramNC && (traineeProgramNC.includes(jobNC) || jobNC.includes(traineeProgramNC))) {
      return 0.8;
    }

    if (traineeCerts.some(cert => cert.includes(jobNC) || jobNC.includes(cert))) {
      return 0.75;
    }

    const jobTokens = tokenize(jobNC);
    const certTokens = traineeCerts.flatMap(cert => tokenize(cert));
    return jaccardSimilarity(jobTokens, certTokens);
  };

  const getLocationFitScore = (trainee, job) => {
    const traineeAddress = normalizeLooseText(trainee?.address || '');
    const jobLocation = normalizeLooseText(job?.location || '');

    if (!jobLocation && !traineeAddress) return 0.5;
    if (!jobLocation || !traineeAddress) return 0.4;

    if (traineeAddress.includes(jobLocation) || jobLocation.includes(traineeAddress)) {
      return 1;
    }

    const score = jaccardSimilarity(tokenize(traineeAddress), tokenize(jobLocation));
    if (score > 0) return Math.min(0.9, 0.4 + score * 0.6);
    return 0.2;
  };

  const getPartnerQualityScore = (job) => {
    const partner = partners.find(record => String(record.id) === String(job?.partnerId));
    let score = 0.55;

    if (partner) {
      const verification = normalizeLooseText(partner.verificationStatus || '');
      if (verification === 'verified') score += 0.25;
      else if (verification === 'under review') score += 0.12;
      else if (verification === 'pending') score += 0.05;
      else if (verification === 'rejected') score -= 0.2;

      const activity = normalizeLooseText(partner.activityStatus || '');
      if (activity === 'online') score += 0.1;
      else if (activity === 'offline') score -= 0.05;
    }

    const jobApps = applications.filter(app => String(app.jobId) === String(job?.id));
    if (jobApps.length > 0) {
      const accepted = jobApps.filter(app => normalizeLooseText(app.status) === 'accepted').length;
      const acceptedRate = accepted / jobApps.length;
      score += acceptedRate * 0.1;
    }

    return Math.min(1, Math.max(0, score));
  };

  const buildRecommendationReasons = (signals) => {
    const reasons = [];

    if (signals.competency >= 0.5) reasons.push(`Competency match ${Math.round(signals.competency * 100)}%`);
    if (signals.ncLevel >= 0.75) reasons.push('Strong NC level alignment');
    if (signals.skill >= 0.5) reasons.push(`Skill match ${Math.round(signals.skill * 100)}%`);
    if (signals.interest >= 0.4) reasons.push('Aligned with your interests');
    if (signals.location >= 0.7) reasons.push('Location fit');
    if (signals.partnerQuality >= 0.8) reasons.push('Trusted active partner');
    if (signals.recency >= 0.8) reasons.push('Recently posted');

    if (reasons.length === 0) {
      reasons.push('General opportunity fit');
    }

    return reasons.slice(0, 3);
  };

  const computeRecommendationForJob = (trainee, job) => {
    if (!trainee || !job) {
      return {
        matchRate: 0,
        signals: {
          competency: 0,
          skill: 0,
          ncLevel: 0,
          interest: 0,
          location: 0,
          partnerQuality: 0,
          recency: 0,
        },
        weights: { ...RECOMMENDER_BASE_WEIGHTS },
        reasons: ['Insufficient data'],
        engineVersion: RECOMMENDER_ENGINE_VERSION,
      };
    }

    const traineeComps = getTraineeProgramCompetencies(trainee);
    const jobCompetencies = normalizeCompetencyList(job.requiredCompetencies || []);
    const competencyScore = jobCompetencies.length > 0
      ? fuzzySetOverlap(jobCompetencies, traineeComps)
      : 0;

    const jobSkills = (job.requiredSkills || []).map(skill => normalizeLooseText(skill)).filter(Boolean);
    const traineeSkills = (trainee.skills || []).map(skill =>
      normalizeLooseText(typeof skill === 'object' ? skill.name : skill)
    ).filter(Boolean);
    const skillScore = jobSkills.length > 0 ? fuzzySetOverlap(jobSkills, traineeSkills) : 0;

    const interestTokens = (trainee.interests || [])
      .map(interest => normalizeLooseText(interest))
      .flatMap(interest => tokenize(interest));
    const jobInterestText = `${job.description || ''} ${job.title || ''} ${job.industry || ''} ${job.opportunityType || ''}`;
    const interestScore = interestTokens.length > 0
      ? jaccardSimilarity(interestTokens, tokenize(jobInterestText))
      : 0;

    const jobTs = getJobTimestamp(job);
    const daysSincePosted = jobTs > 0
      ? (Date.now() - jobTs) / (1000 * 60 * 60 * 24)
      : Number.POSITIVE_INFINITY;
    const recencyScore = Number.isFinite(daysSincePosted)
      ? (daysSincePosted <= 7 ? 1 : daysSincePosted <= 30 ? 0.85 : daysSincePosted <= 90 ? 0.55 : 0.25)
      : 0.5;

    const signals = {
      competency: competencyScore,
      skill: skillScore,
      ncLevel: getNCLAlignmentScore(trainee, job),
      interest: interestScore,
      location: getLocationFitScore(trainee, job),
      partnerQuality: getPartnerQualityScore(job),
      recency: recencyScore,
    };

    const activeWeights = { ...RECOMMENDER_BASE_WEIGHTS };
    if (jobCompetencies.length === 0) activeWeights.competency = 0;
    if (jobSkills.length === 0) activeWeights.skill = 0;
    if (!normalizeLooseText(job.ncLevel || '')) activeWeights.ncLevel = 0;
    if (interestTokens.length === 0) activeWeights.interest = 0;
    if (!normalizeLooseText(job.location || '') || !normalizeLooseText(trainee.address || '')) activeWeights.location = 0;

    const totalWeight = Object.values(activeWeights).reduce((sum, value) => sum + value, 0);
    const normalizedWeights = totalWeight > 0
      ? Object.fromEntries(Object.entries(activeWeights).map(([key, value]) => [key, value / totalWeight]))
      : { ...activeWeights };

    const weightedScore = Object.entries(normalizedWeights).reduce((sum, [key, weight]) => {
      return sum + (weight * (signals[key] || 0));
    }, 0);

    const matchRate = Math.min(100, Math.max(0, Math.round(weightedScore * 100)));

    return {
      matchRate,
      signals,
      weights: normalizedWeights,
      reasons: buildRecommendationReasons(signals),
      engineVersion: RECOMMENDER_ENGINE_VERSION,
    };
  };

  const resolveTraineeForMatching = (traineeId) => {
    const fromDirectory = trainees.find(t => String(t.id) === String(traineeId));
    const isCurrentTrainee = userRole === 'trainee' && String(currentUser?.id || '') === String(traineeId || '');

    if (isCurrentTrainee) {
      return {
        ...(fromDirectory || {}),
        ...(currentUser || {}),
        id: traineeId,
      };
    }

    return fromDirectory || null;
  };

  const getMatchRate = (traineeId, jobId) => {
    const trainee = resolveTraineeForMatching(traineeId);
    const job = jobPostings.find(j => j.id === jobId);
    const result = computeRecommendationForJob(trainee, job);
    return result.matchRate;
  };

  const getGapAnalysis = (traineeId, jobId) => {
    const trainee = resolveTraineeForMatching(traineeId);
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
    const trainee = resolveTraineeForMatching(traineeId);
    if (!trainee) return [];

    const ranked = jobPostings
      .filter(j => j.status === 'Open')
      .map(job => {
        const rec = computeRecommendationForJob(trainee, job);
        return {
          ...job,
          matchRate: rec.matchRate,
          recommendationSignals: rec.signals,
          recommendationWeights: rec.weights,
          recommendationReasons: rec.reasons,
          recommendationEngine: rec.engineVersion,
          recommendationType: 'exploit',
        };
      })
      .sort((a, b) => b.matchRate - a.matchRate);

    if (ranked.length <= 3) return ranked;

    const exploitCount = Math.max(1, Math.ceil(ranked.length * 0.8));
    const exploit = ranked.slice(0, exploitCount);

    const explorePool = ranked
      .slice(exploitCount)
      .sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

    const explore = explorePool.map(job => ({ ...job, recommendationType: 'explore' }));

    if (explore.length === 0) return exploit;

    const mixed = [];
    let exploreIndex = 0;
    for (let index = 0; index < exploit.length; index += 1) {
      mixed.push(exploit[index]);
      if ((index + 1) % 4 === 0 && exploreIndex < explore.length) {
        mixed.push(explore[exploreIndex]);
        exploreIndex += 1;
      }
    }

    while (exploreIndex < explore.length) {
      mixed.push(explore[exploreIndex]);
      exploreIndex += 1;
    }

    return mixed;
  };

  const getSkillInterestRecommendations = (traineeId) => {
    const MAX_WORDS_PER_BUBBLE = 3;
    const MAX_BUBBLES_PER_LANE = 6;

    const trainee = resolveTraineeForMatching(traineeId);
    if (!trainee) {
      return {
        skills: [],
        interests: [],
        dualTypeLabels: [],
        engine: 'autonomous-bubble-v1',
      };
    }

    const normalizeLabel = (value = '') => String(value || '')
      .replace(/[_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const toReadableLabel = (value = '') => {
      const normalized = normalizeLabel(value);
      if (!normalized) return '';
      const connectorWords = new Set(['and', 'or', 'to', 'in', 'on', 'at', 'of', 'for', 'with', 'by', 'from', 'the', 'a', 'an']);
      const compactWords = normalized
        .split(' ')
        .filter(Boolean)
        .slice(0, MAX_WORDS_PER_BUBBLE);

      return compactWords
        .map((token, index) => {
          const lower = token.toLowerCase();

          if (index > 0 && connectorWords.has(lower)) {
            return lower;
          }

          if (/^[a-z]{1,3}\d+$/i.test(token) || /^[A-Z]{2,4}$/.test(token)) {
            return token.toUpperCase();
          }

          return token
            .split('-')
            .map(part => {
              const partLower = String(part || '').toLowerCase();
              if (!partLower) return '';
              return `${partLower[0].toUpperCase()}${partLower.slice(1)}`;
            })
            .join('-');
        })
        .join(' ');
    };

    const toLabelArray = (values = []) => (Array.isArray(values) ? values : [])
      .map(item => {
        if (typeof item === 'object') return normalizeLabel(item?.name || item?.label || '');
        return normalizeLabel(item);
      })
      .filter(Boolean);

    const buildKeySet = (labels = []) => new Set(labels.map(label => normalizeLooseText(label)));

    const addCandidate = (map, label, score, source) => {
      const cleanLabel = toReadableLabel(label);
      const key = normalizeLooseText(cleanLabel);
      if (!cleanLabel || !key || key.length < 3 || !Number.isFinite(score) || score <= 0) return;

      const blocked = new Set(['other', 'general', 'work', 'job', 'training', 'program', 'skills', 'skill', 'interest', 'interests']);
      if (blocked.has(key)) return;

      const existing = map.get(key);
      if (existing) {
        existing.score += score;
        existing.sources[source] = (existing.sources[source] || 0) + score;
        return;
      }

      map.set(key, {
        key,
        label: cleanLabel,
        score,
        sources: { [source]: score },
        wordCount: cleanLabel.split(' ').filter(Boolean).length,
      });
    };

    const traineeSkills = toLabelArray(trainee.skills || []);
    const traineeInterests = toLabelArray(trainee.interests || []);
    const traineeSkillSet = buildKeySet(traineeSkills);
    const traineeInterestSet = buildKeySet(traineeInterests);
    const traineeProgramTokens = tokenize(trainee.program || '');

    const skillMap = new Map();
    const interestMap = new Map();

    const traineeSkillTokens = traineeSkills.flatMap(skill => tokenize(skill));
    const traineeInterestTokens = traineeInterests.flatMap(interest => tokenize(interest));

    const peerSignals = trainees
      .filter(peer => String(peer?.id || '') !== String(trainee.id || ''))
      .map(peer => {
        const peerSkills = toLabelArray(peer.skills || []);
        const peerInterests = toLabelArray(peer.interests || []);
        const peerProgramTokens = tokenize(peer.program || '');

        const programSimilarity = traineeProgramTokens.length > 0
          ? jaccardSimilarity(traineeProgramTokens, peerProgramTokens)
          : 0;

        const skillSimilarity = traineeSkillTokens.length > 0 && peerSkills.length > 0
          ? fuzzySetOverlap(traineeSkills, peerSkills)
          : 0;

        const interestSimilarity = traineeInterestTokens.length > 0 && peerInterests.length > 0
          ? fuzzySetOverlap(traineeInterests, peerInterests)
          : 0;

        const overall = Math.min(1, (programSimilarity * 0.45) + (skillSimilarity * 0.35) + (interestSimilarity * 0.20));
        return { peer, overall };
      })
      .filter(item => item.overall >= 0.2)
      .sort((left, right) => right.overall - left.overall)
      .slice(0, 50);

    peerSignals.forEach(({ peer, overall }) => {
      const peerSkills = toLabelArray(peer.skills || []);
      const peerInterests = toLabelArray(peer.interests || []);

      peerSkills.forEach(skill => {
        addCandidate(skillMap, skill, 2 * overall, 'peer-skill');
        addCandidate(interestMap, skill, 0.35 * overall, 'peer-cross');
      });

      peerInterests.forEach(interest => {
        addCandidate(interestMap, interest, 1.9 * overall, 'peer-interest');
        addCandidate(skillMap, interest, 0.3 * overall, 'peer-cross');
      });
    });

    const openJobs = jobPostings.filter(job => normalizeLooseText(job?.status || '') === 'open');

    const scoredJobs = openJobs
      .map(job => {
        const jobSkills = toLabelArray(job.requiredSkills || []);
        const jobComps = toLabelArray(job.requiredCompetencies || []);
        const jobProgramTokens = tokenize(`${job.ncLevel || ''} ${job.title || ''}`);
        const jobInterestText = `${job.title || ''} ${job.description || ''} ${job.industry || ''} ${job.opportunityType || ''}`;

        const programFit = traineeProgramTokens.length > 0
          ? jaccardSimilarity(traineeProgramTokens, jobProgramTokens)
          : 0;

        const skillFit = traineeSkills.length > 0 && jobSkills.length > 0
          ? fuzzySetOverlap(jobSkills, traineeSkills)
          : 0;

        const interestFit = traineeInterestTokens.length > 0
          ? jaccardSimilarity(traineeInterestTokens, tokenize(jobInterestText))
          : 0;

        const postedDays = (() => {
          const ts = getJobTimestamp(job);
          if (ts <= 0) return 999;
          return (Date.now() - ts) / (1000 * 60 * 60 * 24);
        })();

        const recency = postedDays <= 7 ? 1 : postedDays <= 30 ? 0.7 : postedDays <= 90 ? 0.45 : 0.2;
        const relevance = Math.min(1.8, Math.max(0.2, (programFit * 0.45) + (skillFit * 0.3) + (interestFit * 0.15) + (recency * 0.1)));

        return {
          job,
          relevance,
          jobSkills,
          jobComps,
        };
      })
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, 40);

    scoredJobs.forEach(({ job, relevance, jobSkills, jobComps }) => {
      jobSkills.forEach(skill => {
        addCandidate(skillMap, skill, 2.4 * relevance, 'open-job-skill');
        addCandidate(interestMap, skill, 0.55 * relevance, 'open-job-cross');
      });

      jobComps.forEach(competency => {
        addCandidate(skillMap, competency, 1.4 * relevance, 'open-job-competency');
        addCandidate(interestMap, competency, 0.4 * relevance, 'open-job-cross');
      });

      addCandidate(interestMap, job.industry, 1.35 * relevance, 'open-job-industry');
      addCandidate(interestMap, job.opportunityType, 1.1 * relevance, 'open-job-type');
    });

    const traineeApplications = applications.filter(app => String(app.traineeId) === String(trainee.id));
    traineeApplications.forEach(app => {
      const job = jobPostings.find(record => String(record.id) === String(app.jobId));
      if (!job) return;

      const status = normalizeLooseText(app.status || '');
      const statusWeight = status === 'accepted' ? 1.4 : status === 'pending' ? 1 : status === 'rejected' ? 0.45 : 0.8;

      toLabelArray(job.requiredSkills || []).forEach(skill => {
        addCandidate(skillMap, skill, 1.6 * statusWeight, 'self-application');
        addCandidate(interestMap, skill, 0.4 * statusWeight, 'self-application-cross');
      });

      toLabelArray(job.requiredCompetencies || []).forEach(competency => {
        addCandidate(skillMap, competency, 1.1 * statusWeight, 'self-application');
      });

      addCandidate(interestMap, job.industry, 0.95 * statusWeight, 'self-application');
      addCandidate(interestMap, job.opportunityType, 0.85 * statusWeight, 'self-application');
    });

    const strongPeerIds = new Set(peerSignals.filter(item => item.overall >= 0.35).map(item => String(item.peer.id)));
    applications
      .filter(app => strongPeerIds.has(String(app.traineeId)) && normalizeLooseText(app.status || '') === 'accepted')
      .forEach(app => {
        const job = jobPostings.find(record => String(record.id) === String(app.jobId));
        if (!job) return;

        toLabelArray(job.requiredSkills || []).forEach(skill => {
          addCandidate(skillMap, skill, 0.9, 'peer-outcome');
          addCandidate(interestMap, skill, 0.28, 'peer-outcome-cross');
        });

        addCandidate(interestMap, job.industry, 0.75, 'peer-outcome');
      });

    const buildLane = (map, existingSet, fallbackCount = MAX_BUBBLES_PER_LANE) => {
      const ranked = Array.from(map.values())
        .filter(item => !existingSet.has(item.key) && item.wordCount <= MAX_WORDS_PER_BUBBLE)
        .sort((left, right) => right.score - left.score);

      if (ranked.length === 0) return [];

      const topScore = ranked[0].score || 1;
      const minScore = Math.max(0.6, topScore * 0.22);

      let filtered = ranked.filter(item => item.score >= minScore);
      if (filtered.length < fallbackCount) {
        filtered = ranked.slice(0, Math.max(fallbackCount, filtered.length));
      }

      filtered = filtered.sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (left.wordCount !== right.wordCount) return left.wordCount - right.wordCount;
        return left.label.localeCompare(right.label);
      });

      return filtered.slice(0, MAX_BUBBLES_PER_LANE).map(item => {
        const topSource = Object.entries(item.sources)
          .sort((left, right) => right[1] - left[1])[0]?.[0] || 'mixed';

        return {
          label: item.label,
          score: Number(item.score.toFixed(2)),
          confidence: Number(Math.min(0.99, item.score / (topScore || 1)).toFixed(2)),
          source: topSource,
        };
      });
    };

    const skills = buildLane(skillMap, traineeSkillSet, MAX_BUBBLES_PER_LANE);
    const interests = buildLane(interestMap, traineeInterestSet, MAX_BUBBLES_PER_LANE);

    const interestKeys = new Set(interests.map(item => normalizeLooseText(item.label)));
    // eslint-disable-next-line no-unused-vars
    const skillKeys = new Set(skills.map(item => normalizeLooseText(item.label)));
    const dualTypeLabels = skills
      .map(item => item.label)
      .filter(label => interestKeys.has(normalizeLooseText(label)));

    return {
      skills,
      interests,
      dualTypeLabels,
      engine: 'autonomous-bubble-v1',
    };
  };

  const normalizeApplicationStatus = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'accepted') return 'Accepted';
    if (raw === 'rejected') return 'Rejected';
    if (raw === 'interview scheduled') return 'Interview Scheduled';
    return 'Pending';
  };

  // eslint-disable-next-line no-unused-vars
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
    const trainee = resolveTraineeForMatching(traineeId);
    const applicationMessage = applicationData.applicationMessage?.trim() || null;
    const resumeUrl = applicationData.resumeUrl || null;
    const resumeFileName = applicationData.resumeFileName || null;


    const isSupabaseUser = typeof traineeId === 'string' && traineeId.includes('-');

    if (isSupabaseUser) {
      const attempts = [
        {
          table: 'job_applications',
          payload: {
            student_id: traineeId,
            job_id: jobId,
            status: 'pending',
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
            status: 'pending',
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
        id: data.id, traineeId, jobId, status: 'pending',
        appliedAt: (data.created_at || data.applied_at || '').split('T')[0] || null,
        reviewedAt: null,
        recruitDocumentName: data.recruitment_document_name || null,
        recruitDocumentUrl: data.recruitment_document_url || null,
        recruitSentAt: data.recruitment_sent_at?.split('T')[0] || null,
        sourceTable: insertedTable,
      }]);
    } else {
      const newApplication = {
        id: applications.length + 1, traineeId, jobId, status: 'pending',
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

  const updateApplicationStatus = async (applicationId, statusInput, notes = null) => {
    const normalizeStatus = (s) => {
      const raw = String(s || '').trim().toLowerCase();
      if (!raw || raw === 'received') return 'Pending';
      if (raw === 'interview scheduled') return 'Interview Scheduled';
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    };
    const status = normalizeStatus(statusInput);
    const appRec = applications.find(a => String(a.id) === String(applicationId));
    const conRec = contactRequests.find(r => String(r.id) === String(applicationId));
    const targetRec = appRec || conRec;
    const prevStatus = targetRec?.status;
    const reviewedAt = new Date().toISOString().split('T')[0];

    const isSupabaseApplication = typeof applicationId === 'string' && applicationId.includes('-');
    if (isSupabaseApplication) {
      let persisted = false;
      let lastErrorMessage = '';

      const candidateTables = targetRec?.sourceTable
        ? [targetRec.sourceTable]
        : (targetRec?.recordType === 'contact' ? ['contact_requests'] : ['job_applications']);

      for (const table of candidateTables) {
        const { data, error } = await supabase
          .from(table)
          .update({ status: status.toLowerCase(), notes, reviewed_at: new Date().toISOString() })
          .eq('id', applicationId)
          .select();

        if (error) {
          lastErrorMessage = error.message;
          console.warn(`[updateApplicationStatus] Error in ${table}:`, error);
          if (isSchemaMissingError(error) || isColumnShapeError(error)) continue;
        }

        if (data && data.length > 0) {
          persisted = true;
          break;
        }
      }

      if (!persisted) {
        console.error('Failed to persist status update:', lastErrorMessage || 'No matching record found in candidate tables.');
        alert(`Error: Your decision was not saved to the database. ${lastErrorMessage ? `Details: ${lastErrorMessage}` : 'Please ensure you have run the required SQL migration for contact_requests.'}`);
        return { success: false, error: lastErrorMessage || 'Persistence failed.' };
      }
    }

    setApplications(prev => prev.map(a =>
      String(a.id) === String(applicationId) ? { ...a, status, notes, reviewedAt } : a
    ));
    setContactRequests(prev => prev.map(r =>
      String(r.id) === String(applicationId) ? { ...r, status, notes, reviewed_at: reviewedAt } : r
    ));
    logActivity('Status Change', 'Recruitment', `Record #${applicationId} status changed`, prevStatus, status);
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
      const candidateTables = app?.sourceTable ? [app.sourceTable] : ['job_applications'];
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
      String(a.id) === String(applicationId)
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
        const booking = interviewBookings.find(b => String(b.application_id) === String(a.id) && b.status !== 'cancelled');

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
          matchRate: traineeId && job?.id ? getMatchRate(traineeId, job.id) : null,
          interviewDate: booking?.start_time || null,
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
          status: request.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : (isOutgoing ? 'Sent' : 'Pending'),
          job,
          partner: partner || (job ? { id: job.partnerId, companyName: job.companyName || 'Industry Partner' } : { id: partnerId, companyName: 'Industry Partner' }),
          outgoingMessage: isOutgoing ? request.message : null,
          incomingMessage: isOutgoing ? null : request.message,
           attachmentName: request.attachment_name || null,
          attachmentUrl: request.attachment_url || null,
          attachmentKind: request.attachment_kind || null,
          matchRate: traineeId && job?.id ? getMatchRate(traineeId, job.id) : null,
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
          const booking = interviewBookings.find(b => String(b.application_id) === String(a.id) && b.status !== 'cancelled');

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
            interviewDate: booking?.start_time || null,
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
          status: request.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : (isOutgoing ? 'Sent' : 'Pending'),
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
    const normalizedNcLevel = normalizeNcLevelValue(jobData.ncLevel || selectedProgram?.ncLevel || '');
    const salaryCurrency = toSalaryCurrency(jobData.salaryCurrency);
    const salaryMin = toSalaryNumber(jobData.salaryMin);
    const salaryMax = toSalaryNumber(jobData.salaryMax);
    const normalizedSalaryRange = buildSalaryRangeText(jobData.salaryRange, salaryMin, salaryMax, salaryCurrency);

    const isSupabasePartner = typeof currentUser?.id === 'string' && currentUser.id.includes('-');

    if (isSupabasePartner) {
      try {
        const payload = {
          partnerId: currentUser?.id,
          title: jobData.title,
          opportunityType: jobData.opportunityType || 'Job',
          programId: selectedProgram?.id || jobData.programId || null,
          ncLevel: normalizedNcLevel,
          description: jobData.description || '',
          employmentType: (jobData.opportunityType || 'Job') === 'OJT' ? '' : (jobData.employmentType || ''),
          location: jobData.location || '',
          salaryRange: normalizedSalaryRange,
          salaryCurrency,
          salaryMin,
          salaryMax,
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
      ncLevel: normalizedNcLevel,
      salaryRange: normalizedSalaryRange,
      salaryCurrency,
      salaryMin,
      salaryMax,
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

  const updatePartnerJobPosting = async (jobId, jobData) => {
    const existingJob = jobPostings.find(job => String(job.id) === String(jobId));
    if (!existingJob) {
      return { success: false, error: 'Opportunity not found.' };
    }

    const partner = partners.find(partnerRecord => partnerRecord.id === currentUser?.id);
    const selectedProgram = programs.find(program =>
      String(program.id) === String(jobData.programId || existingJob.programId) ||
      String(program.name) === String(jobData.ncLevel || existingJob.ncLevel)
    );

    const selectedCompetencies = normalizeCompetencyList(selectedProgram?.competencies || []);
    const payloadCompetencies = normalizeCompetencyList(jobData.requiredCompetencies || existingJob.requiredCompetencies || []);
    const normalizedNcLevel = normalizeNcLevelValue(jobData.ncLevel || selectedProgram?.ncLevel || existingJob.ncLevel || '');
    const salaryCurrency = toSalaryCurrency(jobData.salaryCurrency || existingJob.salaryCurrency);
    const salaryMin = toSalaryNumber(jobData.salaryMin ?? existingJob.salaryMin);
    const salaryMax = toSalaryNumber(jobData.salaryMax ?? existingJob.salaryMax);
    const normalizedSalaryRange = buildSalaryRangeText(
      jobData.salaryRange || existingJob.salaryRange,
      salaryMin,
      salaryMax,
      salaryCurrency,
    );

    const updatedPayload = {
      title: jobData.title || existingJob.title || '',
      opportunityType: jobData.opportunityType || existingJob.opportunityType || 'Job',
      programId: selectedProgram?.id || jobData.programId || existingJob.programId || null,
      ncLevel: normalizedNcLevel,
      description: jobData.description || existingJob.description || '',
      employmentType: (jobData.opportunityType || existingJob.opportunityType || 'Job') === 'OJT'
        ? ''
        : (jobData.employmentType || existingJob.employmentType || ''),
      location: jobData.location || existingJob.location || '',
      salaryRange: normalizedSalaryRange,
      salaryCurrency,
      salaryMin,
      salaryMax,
      requiredCompetencies: payloadCompetencies.length > 0 ? payloadCompetencies : selectedCompetencies,
      requiredSkills: normalizeCompetencyList(jobData.requiredSkills || existingJob.requiredSkills || []),
      industry: partner?.industry || partner?.businessType || existingJob.industry || 'General',
      attachmentName: Object.prototype.hasOwnProperty.call(jobData, 'attachmentName')
        ? (jobData.attachmentName || null)
        : (existingJob.attachmentName || null),
      attachmentType: Object.prototype.hasOwnProperty.call(jobData, 'attachmentType')
        ? (jobData.attachmentType || null)
        : (existingJob.attachmentType || null),
      attachmentUrl: Object.prototype.hasOwnProperty.call(jobData, 'attachmentUrl')
        ? (jobData.attachmentUrl || null)
        : (existingJob.attachmentUrl || null),
      status: existingJob.status || 'Open',
    };

    const isSupabasePartner = typeof currentUser?.id === 'string' && currentUser.id.includes('-');

    if (isSupabasePartner) {
      let apiFailureMessage = '';

      const toEmploymentDbValue = (value, selectedOpportunityType) => {
        if (String(selectedOpportunityType || '').trim().toUpperCase() === 'OJT') return null;

        const raw = String(value || '').trim().toLowerCase();
        if (!raw) return null;

        const map = {
          'full-time': 'full_time',
          'full time': 'full_time',
          'full_time': 'full_time',
          'part-time': 'part_time',
          'part time': 'part_time',
          'part_time': 'part_time',
          contract: 'contract',
          internship: 'internship',
        };

        return map[raw] || raw.replace(/\s+/g, '_').replace(/-/g, '_');
      };

      try {
        const response = await fetch(`/api/partner/opportunities/${jobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerId: currentUser?.id,
            ...updatedPayload,
          }),
        });

        const json = await response.json().catch(() => ({}));
        if (response.ok && json?.success && json?.job) {
          setJobPostings(prev => prev.map(job =>
            String(job.id) === String(jobId)
              ? { ...job, ...json.job }
              : job
          ));

          logActivity('Edit', 'Opportunities', `Updated opportunity: ${json.job.title}`, null, null);
          return { success: true, job: json.job };
        }

        apiFailureMessage = json?.error || `Failed to update opportunity (HTTP ${response.status}).`;
      } catch (error) {
        apiFailureMessage = error?.message || 'Failed to update opportunity via API route.';
      }

      try {
        const dbPayload = {
          program_id: updatedPayload.programId || null,
          title: String(updatedPayload.title || '').trim(),
          description: String(updatedPayload.description || '').trim() || null,
          location: String(updatedPayload.location || '').trim(),
          opportunity_type: String(updatedPayload.opportunityType || 'Job').trim() || 'Job',
          nc_level: String(updatedPayload.ncLevel || '').trim() || null,
          employment_type: toEmploymentDbValue(updatedPayload.employmentType, updatedPayload.opportunityType),
          required_competencies: updatedPayload.requiredCompetencies || [],
          required_skills: updatedPayload.requiredSkills || [],
          salary_range: updatedPayload.salaryRange || null,
          salary_min: salaryMin,
          salary_max: salaryMax,
          industry: String(updatedPayload.industry || '').trim() || 'General',
          attachment_name: updatedPayload.attachmentName || null,
          attachment_type: updatedPayload.attachmentType || null,
          attachment_url: updatedPayload.attachmentUrl || null,
          source_url: updatedPayload.attachmentUrl || null,
          source: 'partner',
          is_active: true,
        };

        const attempts = [
          dbPayload,
          {
            ...dbPayload,
            attachment_name: undefined,
            attachment_type: undefined,
            attachment_url: undefined,
          },
        ];

        let fallbackUpdated = false;
        let fallbackError = null;

        for (const attempt of attempts) {
          const cleanAttempt = Object.fromEntries(
            Object.entries(attempt).filter(([, value]) => value !== undefined)
          );

          const { error } = await supabase
            .from('job_postings')
            .update(cleanAttempt)
            .eq('id', jobId)
            .eq('partner_id', currentUser?.id);

          if (!error) {
            fallbackUpdated = true;
            break;
          }

          fallbackError = error;

          const message = String(error?.message || '').toLowerCase();
          const isShapeIssue = ['PGRST204', '42703'].includes(error?.code) || message.includes('column');
          if (!isShapeIssue) {
            break;
          }
        }

        if (!fallbackUpdated) {
          throw fallbackError || new Error('Fallback update failed.');
        }

        const mergedFallbackJob = {
          ...existingJob,
          id: existingJob.id,
          partnerId: existingJob.partnerId,
          companyName: existingJob.companyName || partner?.companyName || 'Company',
          industry: updatedPayload.industry || existingJob.industry || 'General',
          title: updatedPayload.title,
          opportunityType: updatedPayload.opportunityType,
          programId: updatedPayload.programId,
          ncLevel: updatedPayload.ncLevel,
          requiredCompetencies: normalizeCompetencyList(updatedPayload.requiredCompetencies || []),
          requiredSkills: normalizeCompetencyList(updatedPayload.requiredSkills || []),
          description: updatedPayload.description,
          employmentType: updatedPayload.employmentType,
          location: updatedPayload.location,
          salaryRange: updatedPayload.salaryRange,
          salaryCurrency,
          salaryMin,
          salaryMax,
          status: updatedPayload.status || existingJob.status || 'Open',
          datePosted: existingJob.datePosted || new Date().toISOString().split('T')[0],
          createdAt: existingJob.createdAt || new Date().toISOString(),
          attachmentName: updatedPayload.attachmentName || null,
          attachmentType: updatedPayload.attachmentType || null,
          attachmentUrl: updatedPayload.attachmentUrl || null,
        };

        setJobPostings(prev => prev.map(job =>
          String(job.id) === String(jobId)
            ? mergedFallbackJob
            : job
        ));

        logActivity('Edit', 'Opportunities', `Updated opportunity: ${mergedFallbackJob.title}`, null, null);
        return { success: true, job: mergedFallbackJob };
      } catch (fallbackError) {
        const fallbackMessage = fallbackError?.message || 'Failed to update opportunity.';
        const needsApiRestartHint = /http\s*404|not\s*found/i.test(String(apiFailureMessage || ''));
        const restartHint = needsApiRestartHint ? ' Start the API server with `npm run otp-server` and retry.' : '';
        return {
          success: false,
          error: apiFailureMessage
            ? `${apiFailureMessage} ${fallbackMessage}${restartHint}`
            : `${fallbackMessage}${restartHint}`,
        };
      }
    }

    const mergedLocalJob = {
      ...existingJob,
      ...updatedPayload,
      companyName: existingJob.companyName || partner?.companyName || 'Company',
      datePosted: existingJob.datePosted || new Date().toISOString().split('T')[0],
      createdAt: existingJob.createdAt || new Date().toISOString(),
    };

    setJobPostings(prev => prev.map(job => (String(job.id) === String(jobId) ? mergedLocalJob : job)));
    logActivity('Edit', 'Opportunities', `Updated opportunity: ${mergedLocalJob.title}`, null, null);
    return { success: true, job: mergedLocalJob };
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

  const deleteJobPosting = async (jobId) => {
    const existing = jobPostings.find(j => j.id === jobId);

    // If ID is a string, it's likely a Supabase UUID
    if (typeof jobId === 'string' && jobId.includes('-')) {
      try {
        const { error } = await supabase
          .from('job_postings')
          .delete()
          .eq('id', jobId);
        if (error) throw error;
      } catch (err) {
        console.error('Error deleting job posting from Supabase:', err);
        return { success: false, error: err.message };
      }
    }

    setJobPostings(prev => prev.filter(j => j.id !== jobId));
    logActivity('Delete', 'Opportunities', `Deleted opportunity: ${existing?.title}`, existing?.title, null);
    return { success: true };
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
          dbUpdates.detailed_address = updates.address;
        }
        if (updates.companySize !== undefined) dbUpdates.company_size = updates.companySize;
        if (updates.website !== undefined) dbUpdates.website = updates.website;
        if (updates.email !== undefined) dbUpdates.contact_email = updates.email;
        if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
        if (updates.benefits !== undefined) dbUpdates.benefits = updates.benefits;
        if (updates.companyInfoVisibility !== undefined) dbUpdates.company_info_visibility = updates.companyInfoVisibility;
        if (updates.mission !== undefined) dbUpdates.mission = updates.mission;
        if (updates.vision !== undefined) dbUpdates.vision = updates.vision;
        if (updates.culture_tags !== undefined) dbUpdates.culture_tags = updates.culture_tags;
        if (updates.perks_tags !== undefined) dbUpdates.perks_tags = updates.perks_tags;
        if (updates.poc_name !== undefined) dbUpdates.poc_name = updates.poc_name;
        if (updates.poc_title !== undefined) dbUpdates.poc_title = updates.poc_title;
        if (updates.poc_photo_url !== undefined) dbUpdates.poc_photo_url = updates.poc_photo_url;
        if (updates.office_location_url !== undefined) dbUpdates.office_location_url = updates.office_location_url;
        if (updates.banner_url !== undefined) dbUpdates.banner_url = updates.banner_url;
        if (updates.company_logo_url !== undefined) {
          dbUpdates.company_logo_url = updates.company_logo_url;
        }

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
        } catch {  
          // Default to generic message
        }
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
        } catch {  
          // Default to generic message
        }
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
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;

        if (updates.birthday !== undefined) dbUpdates.birthdate = updates.birthday;
        if (updates.gender !== undefined) {
          const g = normalizeGender(updates.gender).toLowerCase();
          // Ensure we only send valid lowercase values to satisfy DB check constraint
          dbUpdates.gender = (g === 'male' || g === 'female') ? g : (g ? 'other' : null);
        }
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
        if (updates.trainings !== undefined) dbUpdates.trainings = updates.trainings;
        if (updates.educHistory !== undefined) dbUpdates.educ_history = updates.educHistory;
        if (updates.workExperience !== undefined) dbUpdates.work_experience = updates.workExperience;
        if (updates.email !== undefined) dbUpdates.contact_email = updates.email;
        if (updates.programId !== undefined) dbUpdates.program_id = updates.programId;
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
      const g = updates.gender !== undefined ? normalizeGender(updates.gender) : currentUser.gender;
      const updatedUser = { ...currentUser, ...updates, gender: g };
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
        .select('*, programs(name, nc_level)')
        .eq('id', userId)
        .maybeSingle();

      if (studentErr || !student) {
        return { success: false, error: 'Student record not found.' };
      }

      const resolvedProgramName = await resolveProgramNameFromStudentRecord(student);

      // Build trainee user object for the dashboard
      const address = [student.detailed_address, student.barangay, student.city, student.province, student.region].filter(Boolean).join(', ');
      const traineeUser = {
        id: userId,
        name: student.full_name || student.profile_name || 'Trainee',
        email: authData.user.email || '',
        username: authData.user.email || '',

        address: address || 'Philippines',
        birthday: student.birthdate || '',
        gender: normalizeGender(student.gender),
        studentId: student.student_id || '',
        program: resolvedProgramName,
        programId: student.program_id,
        ncLevel: student.programs?.nc_level || '',
        graduationYear: student.graduation_year || '',
        trainingStatus: student.training_status || 'Student',
        certifications: student.certifications || [],
        trainings: student.trainings || [],
        educHistory: student.educ_history || [],
        workExperience: student.work_experience || [],
        competencies: [],
        skills: student.skills || [],
        interests: student.interests || [],
        bio: student.bio || '',
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
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

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
      } catch {  
        // Handle error silently
      }
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
      let parsed = JSON.parse(savedUser);
      if (parsed && (savedRole === 'trainee' || savedRole === 'student')) {
        parsed.gender = normalizeGender(parsed.gender);
      }
      setCurrentUser(parsed);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, userRole]);

  // ─── Data Hydration (Supabase) ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !userRole) return;
    const isSupabaseUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    if (!isSupabaseUser) return;

    let adminRefreshTimeout = null;

    const hydrateCurrentTraineeProgram = async () => {
      if (userRole !== 'trainee' || !currentUser?.id) return;

      const existingProgram = String(currentUser.program || '').trim();
      if (existingProgram) return;

      const resolvedProgramName = await resolveProgramNameFromStudentRecord({
        id: currentUser.id,
        program: currentUser.program,
        programId: currentUser.programId,
        program_id: currentUser.programId,
      });

      const ncLevel = currentUser.ncLevel || (currentUser.programId ? (programs || []).find(p => String(p.id) === String(currentUser.programId))?.ncLevel : '');

      if (!resolvedProgramName) return;

      setCurrentUser(prev => {
        if (!prev || prev.id !== currentUser.id) return prev;

        const nextUser = { ...prev, program: resolvedProgramName, ncLevel: prev.ncLevel || ncLevel };
        localStorage.setItem('currentUser', JSON.stringify(nextUser));
        return nextUser;
      });
    };

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
              ncLevel: student.programs?.nc_level || '',
              employmentStatus: student.employment_status === 'employed' ? 'Employed' : student.employment_status === 'seeking_employment' ? 'Seeking Employment' : 'Not Employed',
              employer: student.employment_work || null,
              jobTitle: student.employment_work || null,
              dateHired: student.employment_start || null,
              accountStatus: student.account_status || 'Active',
              gender: normalizeGender(student.gender),
              personalInfoVisibility: resolveVisibilityFields(student.personal_info_visibility, DEFAULT_STUDENT_PUBLIC_INFO_FIELDS),
            };
          });

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
            mission: p.mission || '',
            vision: p.vision || '',
            culture_tags: Array.isArray(p.culture_tags) ? p.culture_tags : [],
            perks_tags: Array.isArray(p.perks_tags) ? p.perks_tags : [],
            poc_name: p.poc_name || '',
            poc_title: p.poc_title || '',
            poc_photo_url: p.poc_photo_url || '',
            office_location_url: p.office_location_url || '',
            banner_url: p.banner_url || '',
            company_logo_url: p.company_logo_url || p.photo || '',
            photo: p.photo || p.company_logo_url || '',
            accountStatus: p.account_status || 'Active',
            companyInfoVisibility: resolveVisibilityFields(p.company_info_visibility, DEFAULT_PARTNER_PUBLIC_INFO_FIELDS),
          }));

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
            programId: j.program_id || null,
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
            salaryRange: buildSalaryRangeText(j.salary_range, j.salary_min, j.salary_max, 'PHP'),
            salaryMin: toSalaryNumber(j.salary_min),
            salaryMax: toSalaryNumber(j.salary_max),
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

        const baseQuery = await supabase
          .from('students')
          .select('id, full_name, profile_picture_url, contact_email, resume_url, personal_info_visibility');
        stds = baseQuery.data;
        studentsError = baseQuery.error;

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
              gender: normalizeGender(student.gender),
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
            address: partner.detailed_address || partner.city || previous.address || '',
            website: partner.website || previous.website || '',
            company_logo_url: partner.company_logo_url || partner.photo || previous.company_logo_url || null,
            photo: partner.photo || partner.company_logo_url || previous.photo || null,
            banner_url: partner.banner_url || previous.banner_url || null,
            mission: partner.mission || previous.mission || '',
            vision: partner.vision || previous.vision || '',
            culture_tags: Array.isArray(partner.culture_tags) ? partner.culture_tags : (previous.culture_tags || []),
            perks_tags: Array.isArray(partner.perks_tags) ? partner.perks_tags : (previous.perks_tags || []),
            poc_name: partner.poc_name || previous.poc_name || '',
            poc_title: partner.poc_title || previous.poc_title || '',
            poc_photo_url: partner.poc_photo_url || previous.poc_photo_url || '',
            office_location_url: partner.office_location_url || previous.office_location_url || '',
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

        setContactRequests((data || []).map(r => ({ ...r, sourceTable: 'contact_requests', recordType: 'contact' })));
      } catch (err) {
        console.warn('Exception while fetching contact requests:', err);
      }
    };

    hydrateCurrentTraineeProgram();
    fetchAllData();
    fetchApplications();
    fetchContactRequests();

    const recruitmentSyncChannel = supabase
      .channel(`recruitment-sync-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPostComments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posting_comments' }, fetchJobPostingComments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, fetchContactRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, fetchApplications)
      .subscribe();

    if (userRole !== 'admin') {
      return () => {
        if (adminRefreshTimeout) clearTimeout(adminRefreshTimeout);
        supabase.removeChannel(recruitmentSyncChannel);
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
      }, 800); // Increase debounce to prevent rapid sequential fetches
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
      supabase.removeChannel(recruitmentSyncChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, userRole]);

  // ─── REGISTRATION DATA (multi-step persist) ──────────────────────────────
  const [registrationData, setRegistrationData] = useState({});

  // ─── ANALYTICS HELPERS ───────────────────────────────────────────────────
  const getEmploymentStats = () => {
    const total = trainees.length;

    // Core categories
    const employed = trainees.filter(t =>
      t.employmentStatus === 'Employed' ||
      t.employmentStatus === 'Self-Employed' ||
      t.employmentStatus === 'Underemployed'
    ).length;

    const seeking_employment = trainees.filter(t =>
      t.employmentStatus === 'Seeking Employment' ||
      t.employmentStatus === 'Unemployed'
    ).length;

    const not_employed = trainees.filter(t => t.employmentStatus === 'Not Employed').length;

    const employmentRate = total > 0 ? Math.round((employed / total) * 100) : 0;

    return {
      total,
      employed,
      seeking_employment,
      not_employed,
      employmentRate,
      // For legacy components that might still reference these
      selfEmployed: 0,
      underEmployed: 0,
      unemployed: seeking_employment
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
      updatePartnerJobPosting,
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
      getSkillInterestRecommendations,
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
      adminDeletePost,
      adminUpdatePost,
      addPostComment,
      getPostComments,
      addJobPostingComment,
      getJobPostingComments,
      updateJobPostingComment,
      deleteJobPostingComment,
      sendContactRequest,
      // Post Interactions (Bulletin)
      postInteractions,
      fetchPostInteractions,
      createPostInteraction,
      updatePostInteractionStatus,
      getPostInteractions,
      getUserPostInteraction,
      // Interview Scheduling
      availabilitySlots,
      interviewBookings,
      fetchAvailability,
      saveAvailabilitySlot,
      deleteAvailabilitySlot,
      fetchBookings,
      fetchTraineeBookings,
      saveInterviewBooking,
      getPartnerAvailability,
    }}>
      {children}
    </AppContext.Provider>
  );
};
