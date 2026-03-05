import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    permissions: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Useful to prevent super admin roles from being disabled
    isSystemRole: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const RolePermissions = mongoose.models.RolePermissions || mongoose.model('RolePermissions', rolePermissionSchema);
export default RolePermissions;
