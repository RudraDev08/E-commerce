/**
 * LIFECYCLE ENFORCEMENT ENGINE
 * Purpose: Enforce state machine transitions and governance rules
 * Scope: All master data entities (Size, Color, Variant, Attribute)
 */

class LifecycleEngine {
    // ==================== STATE MACHINE DEFINITIONS ====================

    static STATE_MACHINES = {
        VARIANT: {
            states: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'MATURE', 'CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
            transitions: {
                'DRAFT': ['PENDING_APPROVAL', 'ACTIVE', 'ARCHIVED'],
                'PENDING_APPROVAL': ['ACTIVE', 'DRAFT', 'ARCHIVED'],
                'ACTIVE': ['MATURE', 'CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
                'MATURE': ['CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
                'CLEARANCE': ['DISCONTINUED', 'ARCHIVED'],
                'DISCONTINUED': ['ARCHIVED'],
                'ARCHIVED': [] // Terminal state
            },
            initialState: 'DRAFT',
            terminalStates: ['ARCHIVED']
        },

        SIZE: {
            states: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'],
            transitions: {
                'DRAFT': ['ACTIVE', 'ARCHIVED'],
                'ACTIVE': ['DEPRECATED', 'ARCHIVED'],
                'DEPRECATED': ['ARCHIVED'],
                'ARCHIVED': []
            },
            initialState: 'DRAFT',
            terminalStates: ['ARCHIVED']
        },

        COLOR: {
            states: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'LOCKED', 'ARCHIVED'],
            transitions: {
                'DRAFT': ['ACTIVE', 'ARCHIVED'],
                'ACTIVE': ['DEPRECATED', 'LOCKED', 'ARCHIVED'],
                'DEPRECATED': ['ARCHIVED'],
                'LOCKED': ['ACTIVE', 'ARCHIVED'], // Can unlock
                'ARCHIVED': []
            },
            initialState: 'DRAFT',
            terminalStates: ['ARCHIVED']
        },

        ATTRIBUTE_TYPE: {
            states: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'],
            transitions: {
                'DRAFT': ['ACTIVE', 'ARCHIVED'],
                'ACTIVE': ['DEPRECATED', 'ARCHIVED'],
                'DEPRECATED': ['ARCHIVED'],
                'ARCHIVED': []
            },
            initialState: 'DRAFT',
            terminalStates: ['ARCHIVED']
        },

        ATTRIBUTE_VALUE: {
            states: ['DRAFT', 'ACTIVE', 'INACTIVE', 'DEPRECATED', 'ARCHIVED'],
            transitions: {
                'DRAFT': ['ACTIVE', 'ARCHIVED'],
                'ACTIVE': ['INACTIVE', 'DEPRECATED', 'ARCHIVED'],
                'INACTIVE': ['ACTIVE', 'DEPRECATED', 'ARCHIVED'],
                'DEPRECATED': ['ARCHIVED'],
                'ARCHIVED': []
            },
            initialState: 'DRAFT',
            terminalStates: ['ARCHIVED']
        }
    };

    // ==================== VALIDATION ====================

    /**
     * Validate state transition
     * @param {string} entityType - Entity type (VARIANT, SIZE, COLOR, etc.)
     * @param {string} currentState - Current lifecycle state
     * @param {string} newState - Proposed new state
     * @returns {Object} { valid: boolean, error: string|null }
     */
    static validateTransition(entityType, currentState, newState) {
        const machine = this.STATE_MACHINES[entityType];

        if (!machine) {
            return {
                valid: false,
                error: `Unknown entity type: ${entityType}`
            };
        }

        if (!machine.states.includes(currentState)) {
            return {
                valid: false,
                error: `Invalid current state: ${currentState}`
            };
        }

        if (!machine.states.includes(newState)) {
            return {
                valid: false,
                error: `Invalid new state: ${newState}`
            };
        }

        const allowedTransitions = machine.transitions[currentState] || [];

        if (!allowedTransitions.includes(newState)) {
            return {
                valid: false,
                error: `Invalid transition: ${currentState} → ${newState}. Allowed: ${allowedTransitions.join(', ')}`
            };
        }

        return { valid: true, error: null };
    }

    /**
     * Check if state is terminal
     */
    static isTerminalState(entityType, state) {
        const machine = this.STATE_MACHINES[entityType];
        return machine?.terminalStates.includes(state) || false;
    }

    /**
     * Get allowed transitions from current state
     */
    static getAllowedTransitions(entityType, currentState) {
        const machine = this.STATE_MACHINES[entityType];
        return machine?.transitions[currentState] || [];
    }

    // ==================== GOVERNANCE RULES ====================

    /**
     * Enforce governance rules before state transition
     */
    static async enforceGovernanceRules(entity, newState, context = {}) {
        const rules = [];

        // Rule 1: Cannot deprecate if in use
        if (newState === 'DEPRECATED' || newState === 'ARCHIVED') {
            if (entity.usageCount > 0 && !context.forceDeprecation) {
                rules.push({
                    rule: 'USAGE_CHECK',
                    passed: false,
                    message: `Cannot ${newState.toLowerCase()} entity with ${entity.usageCount} active references`
                });
            }
        }

        // Rule 2: Locked entities require special permission
        if (entity.isLocked && !context.hasUnlockPermission) {
            rules.push({
                rule: 'LOCK_CHECK',
                passed: false,
                message: 'Cannot modify locked entity without unlock permission'
            });
        }

        // Rule 3: Brand colors cannot be deprecated
        if (entity.isBrandColor && newState === 'DEPRECATED') {
            rules.push({
                rule: 'BRAND_COLOR_CHECK',
                passed: false,
                message: 'Cannot deprecate brand color'
            });
        }

        // Rule 4: Approval required for certain transitions
        if (['ACTIVE', 'MATURE'].includes(newState) && entity.requiresApproval && !entity.approvedBy) {
            rules.push({
                rule: 'APPROVAL_CHECK',
                passed: false,
                message: 'Approval required before activation'
            });
        }

        // Rule 5: Replacement required for deprecation
        if (newState === 'DEPRECATED' && !entity.replacedBy && !context.allowOrphanDeprecation) {
            rules.push({
                rule: 'REPLACEMENT_CHECK',
                passed: false,
                message: 'Replacement entity required for deprecation'
            });
        }

        const failedRules = rules.filter(r => !r.passed);

        return {
            valid: failedRules.length === 0,
            rules,
            failedRules,
            errors: failedRules.map(r => r.message)
        };
    }

    // ==================== TRANSITION EXECUTION ====================

    /**
     * Execute state transition with full validation
     */
    static async executeTransition(entity, newState, context = {}) {
        const entityType = context.entityType || 'VARIANT';
        const currentState = entity.lifecycleState;

        // 1. Validate transition
        const transitionValidation = this.validateTransition(entityType, currentState, newState);
        if (!transitionValidation.valid) {
            throw new Error(`TRANSITION_ERROR: ${transitionValidation.error}`);
        }

        // 2. Enforce governance rules
        const governanceValidation = await this.enforceGovernanceRules(entity, newState, context);
        if (!governanceValidation.valid) {
            throw new Error(`GOVERNANCE_ERROR: ${governanceValidation.errors.join('; ')}`);
        }

        // 3. Execute pre-transition hooks
        await this._executePreTransitionHooks(entity, currentState, newState, context);

        // 4. Update state
        entity.lifecycleState = newState;

        // 5. Update related fields
        if (newState === 'ACTIVE') {
            entity.isActive = true;
            entity.launchDate = entity.launchDate || new Date();
        }

        if (newState === 'DEPRECATED') {
            entity.deprecatedAt = new Date();
            entity.isActive = false;
        }

        if (newState === 'DISCONTINUED') {
            entity.discontinuedDate = new Date();
            entity.isActive = false;
        }

        if (newState === 'ARCHIVED') {
            entity.archivedDate = new Date();
            entity.isActive = false;
        }

        // 6. Add audit log entry
        if (entity.auditLog) {
            entity.auditLog.push({
                action: 'STATUS_CHANGED',
                by: context.userId,
                at: new Date(),
                changes: {
                    from: currentState,
                    to: newState
                },
                metadata: context.metadata || {}
            });
        }

        // 7. Execute post-transition hooks
        await this._executePostTransitionHooks(entity, currentState, newState, context);

        return {
            success: true,
            previousState: currentState,
            newState,
            entity
        };
    }

    // ==================== HOOKS ====================

    static async _executePreTransitionHooks(entity, currentState, newState, context) {
        // Hook: Before deprecation, verify replacement exists
        if (newState === 'DEPRECATED' && entity.replacedBy) {
            // Verify replacement entity exists and is active
            const ReplacementModel = context.model;
            if (ReplacementModel) {
                const replacement = await ReplacementModel.findById(entity.replacedBy);
                if (!replacement || replacement.lifecycleState !== 'ACTIVE') {
                    throw new Error('Replacement entity must be active');
                }
            }
        }

        // Hook: Before archiving, verify no active inventory
        if (newState === 'ARCHIVED' && entity.inventorySummary) {
            if (entity.inventorySummary.totalQuantity > 0) {
                throw new Error('Cannot archive entity with active inventory');
            }
        }
    }

    static async _executePostTransitionHooks(entity, currentState, newState, context) {
        // Hook: Emit lifecycle event
        if (context.eventEmitter) {
            context.eventEmitter.emit('lifecycle.transition', {
                entityType: context.entityType,
                entityId: entity._id,
                previousState: currentState,
                newState,
                timestamp: new Date()
            });
        }

        // Hook: Update search index
        if (context.searchIndexer && ['ACTIVE', 'DEPRECATED', 'ARCHIVED'].includes(newState)) {
            await context.searchIndexer.updateEntity(entity);
        }
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Validate batch transitions
     */
    static validateBatchTransitions(entities, newState, entityType) {
        const results = entities.map(entity => {
            const validation = this.validateTransition(
                entityType,
                entity.lifecycleState,
                newState
            );

            return {
                entity,
                valid: validation.valid,
                error: validation.error
            };
        });

        const valid = results.filter(r => r.valid);
        const invalid = results.filter(r => !r.valid);

        return {
            valid: invalid.length === 0,
            validCount: valid.length,
            invalidCount: invalid.length,
            results,
            errors: invalid.map(r => ({ id: r.entity._id, error: r.error }))
        };
    }
}

// ==================== GOVERNANCE POLICY ENGINE ====================

class GovernancePolicyEngine {
    /**
     * Check if user has permission for action
     */
    static async checkPermission(user, action, entity, context = {}) {
        const policies = {
            'DEPRECATE_MASTER': ['ADMIN', 'CATALOG_MANAGER'],
            'LOCK_ENTITY': ['ADMIN'],
            'UNLOCK_ENTITY': ['ADMIN'],
            'APPROVE_VARIANT': ['ADMIN', 'CATALOG_MANAGER', 'APPROVER'],
            'FORCE_TRANSITION': ['ADMIN'],
            'BYPASS_GOVERNANCE': ['ADMIN']
        };

        const requiredRoles = policies[action] || [];
        const userRoles = user.roles || [];

        const hasPermission = requiredRoles.some(role => userRoles.includes(role));

        return {
            allowed: hasPermission,
            action,
            user: user._id,
            requiredRoles,
            userRoles
        };
    }

    /**
     * Enforce segmentation rules
     */
    static validateSegmentation(entity, context = {}) {
        const errors = [];

        // Rule: B2B products cannot leak into B2C
        if (entity.availableChannels?.includes('B2B') &&
            entity.availableChannels?.includes('WEB') &&
            !context.allowCrossChannel) {
            errors.push('B2B products cannot be available on WEB channel without explicit approval');
        }

        // Rule: Region-specific products must have region set
        if (entity.availableRegions?.length > 0 &&
            !entity.availableRegions.includes('GLOBAL') &&
            !entity.primaryRegion) {
            errors.push('Region-specific products must have primaryRegion set');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// ==================== EXPORTS ====================

export {
    LifecycleEngine,
    GovernancePolicyEngine
};

export default LifecycleEngine;
