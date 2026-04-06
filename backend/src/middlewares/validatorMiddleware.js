const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

const validatorMiddleware = (schema) =>
  asyncHandler(async (req, res, next) => {
    const options = { abortEarly: false };

    try {
      if (schema.body) {
        await schema.body.validateAsync(req.body, options);
      }

      if (schema.params) {
        await schema.params.validateAsync(req.params, options);
      }

      if (schema.query) {
        await schema.query.validateAsync(req.query, options);
      }

      next();
    } catch (err) {
      const errors = err.details.map((e) => e.message).join(", ");
      next(new ApiError(errors, 400));
    }
  });

module.exports = validatorMiddleware;
