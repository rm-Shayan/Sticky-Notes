export const asyncHandler = (fn) => {
  return async (req, res, next) => { // ✅ include 'next'
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error); // ✅ passes error to ApiErrorMiddleware
    }
  };
};
