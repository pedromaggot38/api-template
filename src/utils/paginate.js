/**
 * Utilitário genérico de paginação para modelos do Prisma
 * @param {Object} model - Modelo do Prisma (ex: db.equipamento, db.user)
 * @param {Object} options - Opções de busca, filtros, paginação e ordenação
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
export const paginate = async (model, options = {}) => {
  const {
    page = 1,
    limit = 10,
    where = {},
    include = undefined,
    select = undefined,
    sortBy = 'id',
    sortOrder = 'desc',
    allowedSortFields = [],
    defaultSortBy = 'id',
  } = options;

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);

  const validatedLimit = Math.max(
    1,
    Math.min(100, isNaN(parsedLimit) ? 10 : parsedLimit),
  );
  const validatedPage = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage);
  const skip = (validatedPage - 1) * validatedLimit;

  let validatedSortBy = defaultSortBy;
  if (allowedSortFields.length > 0) {
    validatedSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : defaultSortBy;
  } else if (sortBy) {
    validatedSortBy = sortBy;
  }

  const validatedSortOrder = ['asc', 'desc'].includes(
    String(sortOrder).toLowerCase(),
  )
    ? String(sortOrder).toLowerCase()
    : 'desc';

  const queryArgs = {
    where,
    skip,
    take: validatedLimit,
    orderBy: { [validatedSortBy]: validatedSortOrder },
  };

  if (select) {
    queryArgs.select = select;
  } else if (include) {
    queryArgs.include = include;
  }

  const [data, total] = await Promise.all([
    model.findMany(queryArgs),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit) || 1;
  const count = data.length;

  return {
    data,
    pagination: {
      total,
      count,
      page: validatedPage,
      limit: validatedLimit,
      totalPages,
      hasNextPage: validatedPage < totalPages,
      hasPrevPage: validatedPage > 1,
      from: total === 0 ? 0 : skip + 1,
      to: total === 0 ? 0 : skip + count,
    },
  };
};
