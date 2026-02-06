import AttributeValue from '../models/AttributeValue.model.js';
import AttributeType from '../models/AttributeType.model.js';

/**
 * Search Parser Service
 * Maps natural language tokens to Attribute Values
 * Step 8: "Parse queries like 'red cotton xl tshirt'"
 */

export const parseSearchQuery = async (queryString) => {
    if (!queryString || typeof queryString !== 'string') return { text: '', filters: {} };

    const tokens = queryString.toLowerCase().split(/\s+/).filter(t => t);

    const mappedFilters = {};
    const unmappedTokens = [];

    // Optimize: Fetch all potentially matching attribute values in one go
    // We regex match tokens against names/slugs/synonyms
    // Note: This can be heavy if many tokens. For production, use ElasticSearch/Atlas Search.
    // For Mongoose prototype: find values where name matches any token.

    // 1. Find potential matches
    const potentialMatches = await AttributeValue.find({
        $or: tokens.map(t => ({
            name: t.toUpperCase() // Attribute names are UPPERCASE in our convention usually, or check slug
        })).concat(tokens.map(t => ({
            slug: t
        }))).concat(tokens.map(t => ({
            'searchSynonyms': t // If synonyms existed
        })))
    }).populate('attributeType');

    // 2. Map tokens to Attributes
    for (const token of tokens) {
        // Find match for this token
        // Prioritize exact matches
        const exactMatch = potentialMatches.find(pm =>
            pm.slug === token ||
            pm.name === token.toUpperCase()
        );

        if (exactMatch) {
            if (!exactMatch.attributeType) {
                // Skip definition-less values to prevent crash
                continue;
            }
            const typeName = exactMatch.attributeType.name.toLowerCase(); // e.g. 'color'
            // Add to filters
            if (!mappedFilters[typeName]) {
                mappedFilters[typeName] = [];
            }
            mappedFilters[typeName].push(exactMatch._id);
        } else {
            // No attribute match -> Text search token
            unmappedTokens.push(token);
        }
    }

    return {
        text: unmappedTokens.join(' '),
        filters: mappedFilters, // { color: [id], size: [id] }
        structured: {
            attributes: mappedFilters,
            keywords: unmappedTokens
        }
    };
};
