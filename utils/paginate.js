export const paginate = async (model, query = {}, options = {}) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 3;
    const sort = options.sort || { createdAt: -1 };
    const populate = options.populate || "";
    const select = options.select || "";

    const skip = (page - 1) * limit;

    const total = await model.countDocuments(query);
// console.log("limit",options);

    let mongooseQuery = model.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort);

    if (populate) {
        mongooseQuery = mongooseQuery.populate(populate);
    }

    if (select) {
        mongooseQuery = mongooseQuery.select(select);
    }

    const data = await mongooseQuery;

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
