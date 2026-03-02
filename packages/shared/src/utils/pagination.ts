import { PaginationMeta, PaginationQuery } from '../types/api.types';

export const getPaginationParams = (query: PaginationQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;
  const sort = query.sort || 'created_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  return { page, limit, offset, sort, order };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  total,
  page,
  limit,
  total_pages: Math.ceil(total / limit),
  has_next: page < Math.ceil(total / limit),
  has_prev: page > 1,
});
