/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 6 — CATEGORY GOVERNANCE MIDDLEWARE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Enforces that only approved attribute slugs can be VARIANT in a given category.
 * Additional categories can be added to CATEGORY_VARIANT_GOVERNANCE below.
 *
 * Integration:
 *   When creating/updating a CategoryAttribute junction:
 *   → Call: await enforceVariantGovernance(categoryId, [attributeTypeDoc], user)
 *   → Throws if a non-allowed slug is assigned as VARIANT (unless SuperAdmin).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';

/**
 * Category-level governance map.
 * Keys:    category slugs
 * Values:  Set of attribute slugs allowed to be VARIANT in that category.
 *
 * Anything not in the Set MUST be SPECIFICATION in this category.
 * SuperAdmin users may override (see allowedRoles).
 */
export const CATEGORY_VARIANT_GOVERNANCE = Object.freeze({
    electronics: {
        allowedVariantSlugs: new Set(['color', 'storage', 'connectivity']),
        allowedRoles: ['SUPER_ADMIN'],  // Roles that can override
    },
    clothing: {
        allowedVariantSlugs: new Set(['color', 'size', 'fit']),
        allowedRoles: ['SUPER_ADMIN'],
    },
    footwear: {
        allowedVariantSlugs: new Set(['color', 'size']),
        allowedRoles: ['SUPER_ADMIN'],
    },
});

/**
 * Enforce category-level variant governance.
 *
 * @param {string|ObjectId}    categoryId     - Mongo ID of the category
 * @param {AttributeType[]}    attributeTypes - AttributeType documents to audit
 * @param {{ role: string }}   user           - Requesting user (must have .role)
 * @throws {Error}             If a governance violation is detected and user is not SuperAdmin
 */
export async function enforceVariantGovernance(categoryId, attributeTypes, user) {
    const Category = mongoose.models.Category;
    if (!Category) return; // Skip if Category model not registered

    const category = await Category.findById(categoryId, 'slug').lean();
    if (!category) return; // Unknown category — no constraint

    const rule = CATEGORY_VARIANT_GOVERNANCE[category.slug];
    if (!rule) return; // No governance rule defined for this category

    const violations = [];

    for (const attr of attributeTypes) {
        if (attr.attributeRole !== 'VARIANT') continue;
        if (rule.allowedVariantSlugs.has(attr.slug)) continue;

        // Governance violation detected
        const isPrivilegedUser = user && rule.allowedRoles.includes(user.role);

        if (isPrivilegedUser) {
            // SuperAdmin override — log the bypass but allow it
            console.warn(
                `[CategoryGovernance] SUPER_ADMIN OVERRIDE: Attribute '${attr.slug}' ` +
                `set as VARIANT in '${category.slug}' by ${user.role}.`
            );
        } else {
            violations.push(attr.slug);
        }
    }

    if (violations.length > 0) {
        throw Object.assign(
            new Error(
                `GOVERNANCE VIOLATION: In the '${category.slug}' category, only ` +
                `[${[...rule.allowedVariantSlugs].join(', ')}] may be VARIANT. ` +
                `The following attributes must be reclassified to SPECIFICATION: ` +
                `[${violations.join(', ')}]. ` +
                `Contact a SUPER_ADMIN to override.`
            ),
            { statusCode: 403, code: 'CATEGORY_GOVERNANCE_VIOLATION' }
        );
    }
}

/**
 * Express middleware factory.
 * Wraps enforceVariantGovernance for use in API route handlers.
 *
 * Usage:
 *   router.post('/category-attributes', categoryGovernanceMiddleware(), createHandler);
 */
export function categoryGovernanceMiddleware() {
    return async (req, res, next) => {
        try {
            const { categoryId, attributeTypeId } = req.body;
            if (!categoryId || !attributeTypeId) return next();

            const AttributeType = mongoose.models.AttributeType;
            if (!AttributeType) return next();

            const attrType = await AttributeType.findById(attributeTypeId, 'slug attributeRole').lean();
            if (!attrType) return next();

            await enforceVariantGovernance(categoryId, [attrType], req.user);
            next();
        } catch (err) {
            if (err.code === 'CATEGORY_GOVERNANCE_VIOLATION') {
                return res.status(err.statusCode || 403).json({ error: err.message });
            }
            next(err);
        }
    };
}
