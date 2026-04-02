export interface PaginationMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
  hasNext:    boolean
  hasPrev:    boolean
}

export interface PaginatedResult<T> {
  data:       T[]
  pagination: PaginationMeta
}

export function parsePage(query: { page?: string; limit?: string }) {
  const page  = Math.max(1, parseInt(query.page  || '1',  10))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginate<T>(
  data:  T[],
  total: number,
  page:  number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}