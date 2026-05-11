import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

// Utility helpers (replicated from AppContext to keep hooks self-contained)
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

const toSalaryNumber = (value) => {
  const normalized = String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const SALARY_SYMBOL_BY_CURRENCY = { PHP: '\u20B1', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };

const toSalaryCurrency = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return 'PHP';
  return SALARY_SYMBOL_BY_CURRENCY[normalized] ? normalized : 'PHP';
};

const formatSalaryAmount = (value, currency = 'PHP') => {
  const parsed = toSalaryNumber(value);
  if (!parsed) return '';
  const symbol = SALARY_SYMBOL_BY_CURRENCY[toSalaryCurrency(currency)] || '\u20B1';
  return `${symbol}${Math.round(parsed).toLocaleString('en-US')}`;
};

const buildSalaryRangeText = (salaryRange, salaryMin, salaryMax, salaryCurrency = 'PHP') => {
  const existing = String(salaryRange || '').trim();
  if (existing) return existing;
  const minimum = toSalaryNumber(salaryMin);
  const maximum = toSalaryNumber(salaryMax);
  const currency = toSalaryCurrency(salaryCurrency);
  if (minimum && maximum) return `${formatSalaryAmount(minimum, currency)} - ${formatSalaryAmount(maximum, currency)}`;
  if (minimum) return `${formatSalaryAmount(minimum, currency)}+`;
  if (maximum) return `Up to ${formatSalaryAmount(maximum, currency)}`;
  return '';
};

const stripCompetencyCode = (value = '') => String(value)
  .replace(/^\s*[A-Z]{2,}\d+\s*[—-]\s*/i, '')
  .replace(/^\s*\d+\s*[—-]\s*/i, '')
  .replace(/^\s*[•\-*]\s*/, '')
  .trim();

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

const extractCompetenciesFromProgramDescription = (description = '') => {
  if (!description) return [];
  let parsedJson = null;
  try { parsedJson = JSON.parse(description); } catch { parsedJson = null; }
  if (Array.isArray(parsedJson?.competencies)) {
    return parsedJson.competencies.map(item => stripCompetencyCode(item)).filter(Boolean);
  }
  const lines = String(description).split('\n');
  const markerIndex = lines.findIndex(line => /^\s*competencies\s*:?.*$/i.test(line));
  if (markerIndex < 0) return [];
  return lines.slice(markerIndex + 1).map(line => stripCompetencyCode(line)).filter(Boolean);
};

// Map raw Supabase job row to the shape used across the app
const mapJobRow = (j) => ({
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
  ncLevelRaw: normalizeNcLevelValue(j.nc_level || ''),
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
  feedType: 'job',
});

const fetchJobPostings = async (limit = 20) => {
  const { data: jobs, error } = await supabase
    .from('job_postings')
    .select('id, partner_id, program_id, title, company_name, description, requirements, location, salary_min, salary_max, salary_range, employment_type, slots, status, created_at, opportunity_type, nc_level, required_competencies, required_skills, industry, attachment_url, attachment_name, attachment_type, source, source_url, industry_partners(company_name), programs(name, competencies, description)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (jobs || []).map(mapJobRow);
};

export const useJobPostings = (limit = 20, options = {}) => {
  return useQuery({
    queryKey: queryKeys.jobPostings(limit),
    queryFn: () => fetchJobPostings(limit),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
