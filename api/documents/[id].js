import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;

    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // GET — list documents for a trainee
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('trainee_documents')
                .select('*')
                .eq('trainee_id', id)
                .order('uploaded_at', { ascending: false });

            if (error) {
                console.error('Document list error:', error);
                return res.status(400).json({ error: error.message });
            }

            // Also fetch resume_url from registrations table
            let registrationResumeUrl = null;
            const { data: regData } = await supabaseAdmin
                .from('registrations')
                .select('resume_url')
                .eq('id', id)
                .single();
            if (regData?.resume_url) registrationResumeUrl = regData.resume_url;

            res.json({ success: true, documents: data || [], registrationResumeUrl });
        } catch (err) {
            console.error('Document list error:', err);
            res.status(500).json({ error: 'Failed to fetch documents.' });
        }
    }

    // DELETE — delete a document by ID
    else if (req.method === 'DELETE') {
        try {
            // Get the document first to find the storage path
            const { data: doc, error: fetchError } = await supabaseAdmin
                .from('trainee_documents')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !doc) {
                return res.status(404).json({ error: 'Document not found.' });
            }

            // Try to remove from storage
            if (doc.file_url) {
                const pathMatch = doc.file_url.match(/registration-uploads\/(.+)$/);
                if (pathMatch) {
                    await supabaseAdmin.storage.from('registration-uploads').remove([pathMatch[1]]);
                }
            }

            // Delete from database
            const { error: deleteError } = await supabaseAdmin
                .from('trainee_documents')
                .delete()
                .eq('id', id);

            if (deleteError) {
                console.error('Document delete error:', deleteError);
                return res.status(400).json({ error: deleteError.message });
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Document delete error:', err);
            res.status(500).json({ error: 'Failed to delete document.' });
        }
    }

    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
