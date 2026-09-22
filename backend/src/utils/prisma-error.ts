// Translates Prisma client errors into safe HTTP error descriptions.
//
// Errors are matched by name/code (not instanceof) so this file has no
// dependency on the generated client. The raw Prisma message (which can contain
// table names, query arguments or file paths) is never returned to the client:
// it is only ever logged on the server by the error handler.

export interface HttpErrorInfo {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

interface PrismaLikeError {
  name: string;
  code?: unknown;
  meta?: { target?: unknown };
}

export function isPrismaError(err: unknown): err is PrismaLikeError {
  if (typeof err !== 'object' || err === null) return false;
  const name = (err as { name?: unknown }).name;
  return typeof name === 'string' && name.startsWith('PrismaClient');
}

function uniqueFields(target: unknown): string[] {
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return [];
}

const INTERNAL: HttpErrorInfo = {
  status: 500,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

const DATABASE_UNAVAILABLE: HttpErrorInfo = {
  status: 503,
  code: 'DATABASE_UNAVAILABLE',
  message: 'The database is temporarily unavailable. Please try again shortly.',
};

// Known request error codes: https://www.prisma.io/docs/orm/reference/error-reference
function describeKnownRequestError(err: PrismaLikeError, exposeDetails: boolean): HttpErrorInfo {
  switch (err.code) {
    case 'P2002': {
      const fields = uniqueFields(err.meta?.target);
      return {
        status: 409,
        code: 'CONFLICT',
        message: fields.length
          ? `A record with this ${fields.join(', ')} already exists`
          : 'A record with these values already exists',
        details: { fields },
      };
    }
    case 'P2025': // record to update/delete not found
      return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
    case 'P2003': // foreign key constraint failed
    case 'P2014': // change would violate a required relation
      return {
        status: 409,
        code: 'CONFLICT',
        message: 'The operation conflicts with a related record',
      };
    case 'P2034': // write conflict / deadlock
      return {
        status: 409,
        code: 'CONFLICT',
        message: 'The request conflicted with another operation. Please retry.',
      };
    case 'P2000': // value too long for the column
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'One of the submitted values is too long',
      };
    case 'P2011': // null constraint violation
    case 'P2012': // missing required value
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'A required value is missing',
      };
    case 'P1001': // can't reach database
    case 'P1002': // database timed out
    case 'P1008': // operation timed out (e.g. SQLite is locked)
    case 'P1017': // server closed the connection
    case 'P2024': // timed out fetching a connection from the pool
      return DATABASE_UNAVAILABLE;
    case 'P2021': // table does not exist
    case 'P2022': // column does not exist
      return {
        ...INTERNAL,
        message: exposeDetails
          ? 'The database schema is missing or out of date. Run "npm run prisma:deploy" in backend/.'
          : INTERNAL.message,
      };
    default:
      return INTERNAL;
  }
}

// Returns undefined for anything that is not a Prisma error. Every Prisma error
// maps to a safe description, so unknown ones fall back to a generic 500.
export function describePrismaError(
  err: unknown,
  options: { exposeDetails: boolean }
): HttpErrorInfo | undefined {
  if (!isPrismaError(err)) return undefined;

  switch (err.name) {
    case 'PrismaClientKnownRequestError':
      return describeKnownRequestError(err, options.exposeDetails);
    case 'PrismaClientInitializationError': // cannot open/connect to the database
      return DATABASE_UNAVAILABLE;
    default: // validation, unknown request and Rust panic errors
      return INTERNAL;
  }
}
