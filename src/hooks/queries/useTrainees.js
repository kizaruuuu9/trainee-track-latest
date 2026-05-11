import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useTrainees = () => {
  return useQuery({
    queryKey: ['trainees'],
    queryFn: async () => {
      // Logic from AppContext fetchAllData
      let publicDirectoryStudents = [];
      try {
        const response = await fetch('/api/public-directory');
        if (response.ok) {
          const payload = await response.json();
          publicDirectoryStudents = Array.isArray(payload?.students) ? payload.students : [];
        }
      } catch (err) {
        console.warn('Failed to fetch public directory students fallback:', err);
      }

      let stds = [];
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, profile_picture_url, contact_email, resume_url, personal_info_visibility, program:program_id(name), trainings');
        if (!error) {
          stds = data;
        } else {
          console.warn('Direct students query failed, using public directory fallback only:', error);
        }
      } catch (err) {
        console.warn('Direct students query exception:', err);
      }

      const mergedStudents = new Map(
        publicDirectoryStudents.map(student => ([
          student.id,
          {
            id: student.id,
            name: student.name || student.profileName || 'Trainee',
            profileName: student.profileName || student.name || 'Trainee',
            photo: student.photo || null,
            trainingStatus: student.trainingStatus || 'Student',
            program: student.program || '',
            trainings: Array.isArray(student.trainings) ? student.trainings : [],
            personalInfoVisibility: student.personalInfoVisibility || ['name', 'birthday', 'gender', 'program'],
            email: '',
            resumeUrl: null,
          },
        ]))
      );

      stds.forEach(student => {
        const previous = mergedStudents.get(student.id) || {};
        mergedStudents.set(student.id, {
          ...previous,
          id: student.id,
          name: student.full_name || student.profile_name || previous.name || 'Trainee',
          profileName: student.profile_name || student.full_name || previous.profileName || 'Trainee',
          photo: student.profile_picture_url || previous.photo || null,
          personalInfoVisibility: student.personal_info_visibility || previous.personalInfoVisibility || ['name', 'birthday', 'gender', 'program'],
          email: student.contact_email || previous.email || '',
          resumeUrl: student.resume_url || previous.resumeUrl || null,
          program: student.program || previous.program || '',
          trainings: Array.isArray(student.trainings) ? student.trainings : (previous.trainings || []),
        });
      });

      return Array.from(mergedStudents.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
