import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const usePartners = () => {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      let publicDirectoryPartners = [];
      try {
        const response = await fetch('/api/public-directory');
        if (response.ok) {
          const payload = await response.json();
          publicDirectoryPartners = Array.isArray(payload?.partners) ? payload.partners : [];
        }
      } catch (err) {
        console.warn('Failed to fetch public directory partners fallback:', err);
      }

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

      const { data: pts, error: partnersError } = await supabase
        .from('industry_partners')
        .select('id, company_name, contact_person, business_type, company_logo_url, verification_status, company_info_visibility, activity_status, last_seen_at, detailed_address, city, province, region, barangay, regionCode, provinceCode, cityCode, barangayCode, mission, vision, culture_tags, perks_tags, banner_url, poc_name, poc_title, poc_photo_url, office_location_url, achievements, benefits, business_permit_url');

      if (partnersError) {
        console.warn('Direct partners query failed:', partnersError);
      }

      const mergedPartners = new Map(
        publicDirectoryPartners.map(partner => ([
          partner.id,
          {
            id: partner.id,
            companyName: partner.companyName || partner.profileName || 'Industry Partner',
            profileName: partner.profileName || partner.companyName || 'Industry Partner',
            industry: partner.industry || 'General',
            companyInfoVisibility: partner.companyInfoVisibility || ['companyName', 'contactPerson', 'industry'],
            contactPerson: '',
            address: partner.detailed_address || partner.city || '',
            detailed_address: partner.detailed_address || '',
            region: partner.region || '',
            province: partner.province || '',
            city: partner.city || '',
            barangay: partner.barangay || '',
            website: partner.website || '',
            email: partner.contact_email || '',
            contactEmail: partner.contact_email || '',
            verificationStatus: partner.verificationStatus || 'Pending',
          },
        ]))
      );

      (pts || []).forEach(partner => {
        const previous = mergedPartners.get(partner.id) || {};
        const address = [
          partner.detailed_address || previous.detailed_address,
          partner.barangay || previous.barangay,
          partner.city || previous.city,
          partner.province || previous.province,
          partner.region || previous.region
        ].filter(Boolean).join(', ') || '';

        mergedPartners.set(partner.id, {
          ...previous,
          id: partner.id,
          companyName: partner.company_name || previous.companyName || 'Industry Partner',
          profileName: previous.profileName || partner.company_name || partner.contact_person || 'Industry Partner',
          companyInfoVisibility: partner.company_info_visibility || previous.companyInfoVisibility || ['companyName', 'contactPerson', 'industry'],
          contactPerson: partner.contact_person || previous.contactPerson || '',
          industry: partner.business_type || previous.industry || 'General',
          email: partner.contact_email || previous.email || '',
          detailed_address: partner.detailed_address || previous.detailed_address || '',
          region: partner.region || previous.region || '',
          province: partner.province || previous.province || '',
          city: partner.city || previous.city || '',
          barangay: partner.barangay || previous.barangay || '',
          address,
          website: partner.website || previous.website || '',
          company_logo_url: partner.company_logo_url || previous.company_logo_url || null,
          photo: partner.company_logo_url || previous.photo || null,
          banner_url: partner.banner_url || previous.banner_url || null,
          mission: partner.mission || previous.mission || '',
          vision: partner.vision || previous.vision || '',
          culture_tags: partner.culture_tags || previous.culture_tags || [],
          perks_tags: partner.perks_tags || previous.perks_tags || [],
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

      return Array.from(mergedPartners.values());
    },
    staleTime: 5 * 60 * 1000,
  });
};
