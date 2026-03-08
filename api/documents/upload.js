import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { traineeId, label, fileName, fileType, fileData } = req.body;

    if (!traineeId || !label || !fileName || !fileType || !fileData) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: 'Only PDF, DOC, DOCX files are allowed.' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Decode base64 and upload to Supabase Storage
        const buffer = Buffer.from(fileData, 'base64');
        const filePath = `documents/${traineeId}/${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('registration-uploads')
            .upload(filePath, buffer, { contentType: fileType });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return res.status(400).json({ error: uploadError.message });
        }

        const { data: urlData } = supabaseAdmin.storage.from('registration-uploads').getPublicUrl(filePath);
        const fileUrl = urlData?.publicUrl;

        // Save metadata to trainee_documents table
        const { data, error } = await supabaseAdmin
            .from('trainee_documents')
            .insert({
                trainee_id: traineeId,
                label,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
            })
            .select();

        if (error) {
            console.error('Document DB error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, document: data?.[0] });
    } catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ error: 'Failed to upload document.' });
    }
}
