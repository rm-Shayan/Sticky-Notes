import { ApiResponse } from "../Utilities/ApiResponse.js";
import { ApiError } from "../Utilities/ApiError.js";

export const ApiErrorMiddleware = (err, req, res, next) => {
  console.error(err); // Log for debugging

  if (err instanceof ApiError) {
    // Operational API error → JSON response
    return new ApiResponse(err.statusCode, null, err.message).send(res);
  } else {
    // Unexpected server error → generic message
    return new ApiResponse(500, null, "Internal Server Error").send(res);
  }
};
