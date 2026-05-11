import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const stripCompetencyCode = (value = '') => String(value)
  .replace(/^\s*[A-Z]{2,}\d+\s*[—-]\s*/i, '')
  .replace(/^\s*\d+\s*[—-]\s*/i, '')
  .replace(/^\s*[•\-*]\s*/, '')
  .trim();

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

const fetchPrograms = async ({ page = 1, pageSize = 15, search = '' }) => {
  let useFallback = false;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('programs')
    .select('id, name, nc_level, duration_hours, description, competencies', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  let { data, count, error } = await query
    .order('name', { ascending: true })
    .range(from, to);

  const isMissingCompetenciesColumnError = (err) => {
    return err && (err.code === 'PGRST204' || String(err.message || '').toLowerCase().includes('competencies'));
  };

  if (error && isMissingCompetenciesColumnError(error)) {
    useFallback = true;
    let fallbackQuery = supabase
      .from('programs')
      .select('id, name, nc_level, duration_hours, description', { count: 'exact' });
    
    if (search) {
      fallbackQuery = fallbackQuery.ilike('name', `%${search}%`);
    }

    const fallback = await fallbackQuery
      .order('name', { ascending: true })
      .range(from, to);
        
    data = fallback.data;
    count = fallback.count;
    error = fallback.error;
  }

  if (error) throw error;

  const mapped = (data || []).map(row => ({
    id: row.id,
    name: row.name,
    ncLevel: row.nc_level || '',
    durationHours: row.duration_hours || null,
    description: row.description || '',
    competencies: (() => {
      if (!useFallback && Array.isArray(row.competencies)) {
        return row.competencies.map(item => stripCompetencyCode(String(item))).filter(Boolean);
      }
      return extractCompetenciesFromProgramDescription(row.description || '');
    })(),
  }));

  return { data: mapped, total: count || 0 };
};

export const usePrograms = ({ page, pageSize, search } = {}) => {
  return useQuery({
    queryKey: ['programs', { page, pageSize, search }],
    queryFn: () => fetchPrograms({ page, pageSize, search }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};
