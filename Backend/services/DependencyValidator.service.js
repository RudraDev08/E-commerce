import AttributeDependency from '../models/AttributeDependency.model.js';
import logger from '../config/logger.js';

/**
 * DEPENDENCY VALIDATOR SERVICE
 * Phase 5: Attribute Dependency Enforcement
 * 
 * Logic:
 * 1. Given a variant selection (attributeValueIds or attributeDimensions)
 * 2. Find all relevant dependencies where parent is in the selection.
 * 3. Verify that child constraints are met.
 */
export class DependencyValidator {
    /**
     * Validate a collection of attribute value IDs against the dependency graph.
     * 
     * @param {Array<string>} valueIds - Array of AttributeValue ObjectIds
     * @param {Array<Object>} attributeDimensions - Array of { attributeId, valueId } for type mapping
     */
    static async validate(valueIds, attributeDimensions = []) {
        if (!valueIds || valueIds.length === 0) return { valid: true };

        // 1. Map valueId -> typeId for fast lookup
        const valueToTypeMap = new Map();
        attributeDimensions.forEach(dim => {
            if (dim.valueId && dim.attributeId) {
                valueToTypeMap.set(dim.valueId.toString(), dim.attributeId.toString());
            }
        });

        // 2. Fetch all dependencies that might apply
        // (Either parent type matches OR parent value matches)
        const relevantDependencies = await AttributeDependency.find({
            $or: [
                { parentAttributeType: { $in: Array.from(valueToTypeMap.values()) } },
                { parentValue: { $in: valueIds } }
            ]
        }).lean();

        for (const dep of relevantDependencies) {
            const parentTypeId = dep.parentAttributeType.toString();
            const parentValueId = dep.parentValue?.toString();
            const childTypeId = dep.childAttributeType.toString();

            // Check if this dependency is triggered
            let isTriggered = false;
            if (parentValueId) {
                // Triggered if the specific parent value is selected
                isTriggered = valueIds.some(id => id.toString() === parentValueId);
            } else {
                // Triggered if the parent type is present in selection
                isTriggered = Array.from(valueToTypeMap.values()).includes(parentTypeId);
            }

            if (!isTriggered) continue;

            // Dependency is triggered. Now validate the child.
            const selectedChildValueId = attributeDimensions.find(dim => dim.attributeId?.toString() === childTypeId)?.valueId?.toString();

            // Case A: Forbidden
            if (dep.isForbidden) {
                if (selectedChildValueId) {
                    // If allowedValues is empty, any value is forbidden.
                    // If allowedValues has items, specify ONLY those items are forbidden?
                    // According to schema: "allowedValues: [] ... Empty = None allowed (Forbidden)"
                    // Wait, if isForbidden is true, we usually mean the existence of the child is forbidden.
                    if (dep.allowedValues.length === 0 || dep.allowedValues.some(v => v.toString() === selectedChildValueId)) {
                        throw new Error(`DEPENDENCY_VIOLATION: Attribute ${childTypeId} is forbidden when ${parentValueId || parentTypeId} is selected.`);
                    }
                }
            }

            // Case B: Required
            if (dep.isRequired) {
                if (!selectedChildValueId) {
                    throw new Error(`DEPENDENCY_VIOLATION: Attribute ${childTypeId} is required when ${parentValueId || parentTypeId} is selected.`);
                }

                // If allowedValues is specified, the selected value MUST be one of them
                if (dep.allowedValues && dep.allowedValues.length > 0) {
                    const isAllowed = dep.allowedValues.some(v => v.toString() === selectedChildValueId);
                    if (!isAllowed) {
                        throw new Error(`DEPENDENCY_VIOLATION: Value ${selectedChildValueId} for attribute ${childTypeId} is not allowed. Must be one of: ${dep.allowedValues.join(', ')}`);
                    }
                }
            }
        }

        return { valid: true };
    }

    /**
     * Simple Cycle Detection for Dependency Graph
     * (Prevent Infinite Loops in UI/Engine)
     */
    static async detectCycles() {
        const deps = await AttributeDependency.find().leak(true);
        const adj = new Map();

        deps.forEach(d => {
            const p = d.parentAttributeType.toString();
            const c = d.childAttributeType.toString();
            if (!adj.has(p)) adj.set(p, []);
            adj.get(p).push(c);
        });

        const visited = new Set();
        const recStack = new Set();

        const hasCycle = (node) => {
            if (recStack.has(node)) return true;
            if (visited.has(node)) return false;

            visited.add(node);
            recStack.add(node);

            const neighbors = adj.get(node) || [];
            for (const neighbor of neighbors) {
                if (hasCycle(neighbor)) return true;
            }

            recStack.delete(node);
            return false;
        };

        for (const node of adj.keys()) {
            if (hasCycle(node)) {
                logger.error(`[CYCLE_DETECTION] Dependency cycle detected starting at ${node}`);
                return true;
            }
        }

        return false;
    }
}

export default DependencyValidator;
