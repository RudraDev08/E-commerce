export const uploadImage = (req, res) => {
    try {
        // Handle Multiple Files
        if (req.files && req.files.length > 0) {
            const files = req.files.map(file => ({
                url: `/uploads/${file.filename}`,
                filename: file.filename,
                mimetype: file.mimetype
            }));

            return res.status(200).json({
                success: true,
                message: 'Files uploaded successfully',
                data: files
            });
        }

        // Handle Single File
        if (req.file) {
            return res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    url: `/uploads/${req.file.filename}`,
                    filename: req.file.filename,
                    mimetype: req.file.mimetype
                }
            });
        }

        return res.status(400).json({
            success: false,
            message: 'No files uploaded'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed'
        });
    }
};
