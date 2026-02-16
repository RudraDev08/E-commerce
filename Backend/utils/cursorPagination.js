
// ============================================================================
// Cursor Pagination Example
// REPLACES: .skip((page - 1) * limit) -> .skip(cursorId).limit()
// ============================================================================

export const cursorPaginate = async (Model, reqQuery, sortField = '_id', sortDir = -1) => {
    const { limit = 20, cursor, ...filters } = reqQuery;

    // Sort logic
    const sort = { [sortField]: sortDir === -1 ? -1 : 1 };

    const query = { ...filters };
    if (cursor) {
        // Assume cursor is base64 encoded { fieldVal, _id }
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));

        // Complex sort handling (field + _id for stable sort)
        if (sortDir === -1) {
            query.$or = [
                { [sortField]: { $lt: decoded.val } },
                { [sortField]: decoded.val, _id: { $lt: decoded.id } }
            ];
        } else {
            query.$or = [
                { [sortField]: { $gt: decoded.val } },
                { [sortField]: decoded.val, _id: { $gt: decoded.id } }
            ];
        }
    }

    const docs = await Model.find(query).sort({ [sortField]: sortDir, _id: sortDir }).limit(parseInt(limit) + 1);

    const hasNextPage = docs.length > limit;
    const result = hasNextPage ? docs.slice(0, limit) : docs;

    const nextCursor = hasNextPage
        ? Buffer.from(JSON.stringify({
            val: result[result.length - 1][sortField],
            id: result[result.length - 1]._id
        })).toString('base64')
        : null;

    return {
        data: result,
        pageInfo: {
            hasNextPage,
            nextCursor
        }
    };
};
