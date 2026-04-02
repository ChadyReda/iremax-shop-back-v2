export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode = 400,
    isOperational = true
  ) {
    super(message)
    this.statusCode    = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export const notFound    = (r = 'Resource') => new AppError(`${r} not found`, 404)
export const unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401)
export const forbidden    = (msg = 'Forbidden')    => new AppError(msg, 403)
export const conflict     = (msg: string)          => new AppError(msg, 409)
export const badRequest   = (msg: string)          => new AppError(msg, 400)