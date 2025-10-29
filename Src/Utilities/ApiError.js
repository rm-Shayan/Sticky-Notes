
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;       // HTTP status code (e.g., 400, 404, 500)
    this.isOperational = isOperational; // Flag to distinguish operational errors
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}
