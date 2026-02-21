import { useState, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

/**
 * Enterprise-grade VariantImageUpload Component
 * Fully aligned with VariantMaster.enterprise.js imageGallery schema.
 */
const VariantImageUpload = ({
    images = [],
    onChange,
    maxImages = 10,
    variantName = "Variant"
}) => {
    const [isDragging, setIsDragging] = useState(false);

    // ✅ Fix 5: Revoke Object URLs (Memory Safety)
    useEffect(() => {
        return () => {
            images.forEach(img => {
                if (img.file && img.url?.startsWith("blob:")) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, []);

    // ✅ Fix 8: Block Duplicate Primaries From Parent Injection (Self-healing guard)
    useEffect(() => {
        const primaries = images.filter(i => i.isPrimary);
        if (primaries.length > 1 || (images.length > 0 && primaries.length === 0)) {
            const fixed = images.map((img, i) => ({
                ...img,
                isPrimary: i === 0,
                sortOrder: i
            }));
            onChange(fixed);
        }
    }, [images.length]); // Focus on count changes for auto-assignment

    const processFiles = (files) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(f => !validTypes.includes(f.type));

        if (invalidFiles.length > 0) {
            toast.error('Only JPG, PNG, and WebP images are allowed');
            return;
        }

        const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error('Images must be less than 5MB each');
            return;
        }

        if (images.length + files.length > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed per variant`);
            return;
        }

        // ✅ Fix 2: Enterprise Shape Alignment
        const newImages = files.map((file, index) => ({
            file, // Temporary blob reference for upload
            url: URL.createObjectURL(file),
            altText: `${variantName} - ${images.length + index + 1}`,
            isPrimary: images.length === 0 && index === 0,
            sortOrder: images.length + index,
            type: "DETAIL" // HERO | THUMBNAIL | DETAIL | LIFESTYLE
        }));

        const updated = [...images, ...newImages];

        // ✅ Fix 7: Always Normalize sortOrder After Any Change
        const normalized = updated.map((img, i) => ({
            ...img,
            sortOrder: i
        }));

        onChange(normalized);
        toast.success(`${files.length} image(s) staged`);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
        e.target.value = ''; // Reset input
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    // ✅ Fix 3: Enforce Exactly One Primary
    const setPrimary = (index) => {
        const updated = images.map((img, i) => ({
            ...img,
            isPrimary: i === index
        }));
        onChange(updated);
    };

    // ✅ Fix 4: Auto-Reassign Primary on Delete
    const removeImage = (index) => {
        const removedImage = images[index];
        if (removedImage?.url?.startsWith('blob:')) {
            URL.revokeObjectURL(removedImage.url);
        }

        let newImages = images.filter((_, i) => i !== index);

        if (removedImage.isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
        }

        // ✅ Deterministic normalization
        const normalized = newImages.map((img, i) => ({
            ...img,
            sortOrder: i
        }));

        onChange(normalized);
        toast.success('Image removed');
    };

    const updateType = (index, type) => {
        const updated = images.map((img, i) =>
            i === index ? { ...img, type } : img
        );
        onChange(updated);
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
            <div>
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <PhotoIcon className="w-4 h-4 text-indigo-500" />
                    Variant Gallery
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    Aligns with enterprise imageGallery schema ({images.length}/{maxImages})
                </p>
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img, index) => (
                        <div
                            // ✅ Fix 6: Use Stable Keys
                            key={img.url || img._id || `idx-${index}`}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all ${img.isPrimary ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400/20' : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {/* Image Preview */}
                            <div className="aspect-square bg-slate-100 relative">
                                <img
                                    src={img.url}
                                    alt={img.altText || `Variant Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Primary Star Label */}
                                {img.isPrimary && (
                                    <div className="absolute top-2 left-2 bg-yellow-400 text-white p-1 rounded-lg shadow-sm">
                                        <StarIconSolid className="w-3.5 h-3.5" />
                                    </div>
                                )}

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-lg"
                                    title="Remove image"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Image Metadata Controls */}
                            <div className="p-3 bg-white space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <select
                                        value={img.type || 'DETAIL'}
                                        onChange={(e) => updateType(index, e.target.value)}
                                        className="text-[10px] font-bold text-slate-600 bg-slate-50 border-0 rounded-lg px-2 py-1 flex-1 focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="HERO">HERO</option>
                                        <option value="DETAIL">DETAIL</option>
                                        <option value="THUMBNAIL">THUMBNAIL</option>
                                        <option value="LIFESTYLE">LIFESTYLE</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => setPrimary(index)}
                                        className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${img.isPrimary
                                                ? 'bg-yellow-100 text-yellow-600'
                                                : 'bg-slate-50 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500'
                                            }`}
                                        title={img.isPrimary ? 'Primary Image' : 'Set as Primary'}
                                    >
                                        <StarIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 flex justify-between px-1">
                                    <span>ORDER #{img.sortOrder}</span>
                                    {img.isPrimary && <span className="text-yellow-600 font-bold uppercase">Primary</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VariantImageUpload;
