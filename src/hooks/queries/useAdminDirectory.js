import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch administrative directory data (trainees, partners, accounts)
 * with support for pagination and search.
 */
export const useAdminDirectory = ({ page, limit, search, status }) => {
  return useQuery({
    queryKey: ['adminDirectory', { page, limit, search, status }],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/admin/data?t=${timestamp}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch admin data (status ${res.status})`);
      }
      
      const adminData = await res.json();
      
      // Transform data like AppContext.jsx does
      const transformedStudents = (adminData.students || []).map(student => {
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
          program: student.program_name || 'None',
          ncLevel: student.nc_level || '',
          employmentStatus: student.employment_status === 'employed' ? 'Employed' : student.employment_status === 'seeking_employment' ? 'Seeking Employment' : 'Not Employed',
          employer: student.employer || student.employment_work || null,
          jobTitle: student.job_title || student.employment_work || null,
          dateHired: student.date_hired ? new Date(student.date_hired).toLocaleDateString() : student.employment_start || null,
          accountStatus: student.account_status || 'Active',
          gender: student.gender ? (student.gender.toLowerCase().startsWith('m') ? 'Male' : student.gender.toLowerCase().startsWith('f') ? 'Female' : 'Other') : '',
          personalInfoVisibility: Array.isArray(student.personal_info_visibility) ? student.personal_info_visibility : ['name', 'birthday', 'gender', 'program'],
        };
      });

      const transformedPartners = (adminData.partners || []).map(p => {
        const submittedPartnerIds = new Set(adminData.submittedPartnerIds || []);
        const address = [p.detailed_address, p.barangay, p.city, p.province, p.region].filter(Boolean).join(', ');
        return {
          ...p,
          id: p.id,
          profileName: p.profile_name || p.company_name || 'Industry Partner',
          companyName: p.company_name,
          contactPerson: p.contact_person,
          industry: p.business_type || 'General',
          email: p.contact_email || p.email || 'None',
          contactEmail: p.contact_email || '',
          activityStatus: p.activity_status || 'Offline',
          lastSeenAt: p.last_seen_at || null,
          address: address || 'Philippines',
          verificationStatus: p.verification_status === 'verified'
            ? 'Verified'
            : p.verification_status === 'rejected'
              ? 'Rejected'
              : ((p.verification_status === 'pending' && submittedPartnerIds.has(p.id)) || p.verification_status === 'under_review')
                ? 'Under Review'
                : 'Pending',
          accountStatus: p.account_status || 'Active',
        };
      });

      const transformedAccounts = (adminData.accounts || []).map(acc => {
        const isStudent = acc.type === 'trainee';
        const address = [acc.detailed_address, acc.barangay, acc.city, acc.province, acc.region].filter(Boolean).join(', ');
        
        if (isStudent) {
          return {
            id: acc.id,
            type: 'trainee',
            profileName: acc.profile_name || acc.full_name || 'Trainee',
            name: acc.profile_name || acc.full_name || 'Trainee',
            email: acc.email || 'None',
            activityStatus: acc.activity_status || 'Offline',
            lastSeenAt: acc.last_seen_at || null,
            address: address || 'Philippines',
            graduationYear: acc.graduation_year || 'None',
            trainingStatus: acc.training_status || 'Student',
            certifications: acc.certifications || [],
            program: acc.program_name || 'None',
            employmentStatus: acc.employment_status === 'employed' ? 'Employed' : acc.employment_status === 'seeking_employment' ? 'Seeking Employment' : 'Not Employed',
            employer: acc.employer || acc.employment_work || null,
            accountStatus: acc.account_status || 'Active',
          };
        } else {
          return {
            id: acc.id,
            type: 'partner',
            profileName: acc.profile_name || acc.company_name || 'Industry Partner',
            companyName: acc.company_name,
            contactPerson: acc.contact_person,
            industry: acc.business_type || 'General',
            email: acc.contact_email || acc.email || 'None',
            activityStatus: acc.activity_status || 'Offline',
            lastSeenAt: acc.last_seen_at || null,
            address: address || 'Philippines',
            verificationStatus: acc.verification_status === 'verified' ? 'Verified' : acc.verification_status === 'rejected' ? 'Rejected' : 'Pending',
            accountStatus: acc.account_status || 'Active',
          };
        }
      });

      return {
        ...adminData,
        students: transformedStudents,
        partners: transformedPartners,
        accounts: transformedAccounts,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};
