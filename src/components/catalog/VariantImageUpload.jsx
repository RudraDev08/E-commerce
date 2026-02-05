import { useState } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * VariantImageUpload Component
 * 
 * Purpose: Upload and manage images for individual variants
 * Architecture: Variant images are PRIMARY source for PDP color switching
 * 
 * Features:
 * - Multiple image upload
 * - Drag-and-drop reordering
 * - Image preview
 * - Delete individual images
 * - Validation (file type, size)
 */

const VariantImageUpload = ({
    images = [],
    onChange,
    maxImages = 10,
    variantName = "Variant"
}) => {
    const [previews, setPreviews] = useState(images.map(img => img.url || img));
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const processFiles = (files) => {
        // Validate file types
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(f => !validTypes.includes(f.type));

        if (invalidFiles.length > 0) {
            toast.error('Only JPG, PNG, and WebP images are allowed');
            return;
        }

        // Validate file sizes (max 5MB each)
        const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error('Images must be less than 5MB each');
            return;
        }

        // Check max images limit
        const totalImages = images.length + files.length;
        if (totalImages > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed per variant`);
            return;
        }

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);

        // Create image objects with metadata
        const newImages = files.map((file, index) => ({
            file,
            url: URL.createObjectURL(file),
            alt: `${variantName} - Image ${images.length + index + 1}`,
            sortOrder: images.length + index
        }));

        onChange([...images, ...newImages]);
        toast.success(`${files.length} image(s) added`);
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        // Update sort orders
        const reorderedImages = newImages.map((img, i) => ({
            ...img,
            sortOrder: i
        }));

        setPreviews(newPreviews);
        onChange(reorderedImages);
        toast.success('Image removed');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <PhotoIcon className="w-4 h-4 text-indigo-500" />
                        Variant Images
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Upload images specific to this color variant ({images.length}/{maxImages})
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
            >
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={images.length >= maxImages}
                />

                <div className="pointer-events-none">
                    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center">
                        <ArrowUpTrayIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                        {images.length >= maxImages ? 'Maximum images reached' : 'Drop images here or click to upload'}
                    </p>
                    <p className="text-xs text-slate-500">
                        JPG, PNG, WebP up to 5MB • Max {maxImages} images
                    </p>
                </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-300 transition-all"
                        >
                            {/* Image Preview */}
                            <img
                                src={img.url || img}
                                alt={img.alt || `Image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Sort Order Badge */}
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                #{index + 1}
                            </div>

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">
                            Why upload variant images?
                        </h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Each color variant should have its own images. When customers select <strong>Pink</strong> on the product page,
                            they will see only the pink images. When they select <strong>Silver</strong>, the images automatically switch
                            to show the silver variant. This provides a clean, accurate shopping experience.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantImageUpload;
