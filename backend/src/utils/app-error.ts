// Error with an HTTP status, thrown from controllers/services and turned into
// a JSON response by the error-handling middleware.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
