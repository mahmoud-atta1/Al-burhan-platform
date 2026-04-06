const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID غير صالح",
    "any.required": "ID مطلوب",
  }),
});

const createTrackSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({ "string.empty": "اسم المسار مطلوب" }),

  description: Joi.string().allow("").optional(),
  coverImage: Joi.string(),

  educationLevel: Joi.string()
    .valid("1st_secondary", "2nd_secondary", "3rd_secondary")
    .required()
    .messages({
      "any.only": "مرحلة دراسية غير صحيحة",
    }),
}).unknown(false);

const updateTrackSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100),
  description: Joi.string().allow(""),
  coverImage: Joi.string(),

  educationLevel: Joi.string().valid(
    "1st_secondary",
    "2nd_secondary",
    "3rd_secondary",
  ),

  active: Joi.boolean(),
}).unknown(false);

exports.createTrackValidator = validatorMiddleware({
  body: createTrackSchema,
});

exports.updateTrackValidator = validatorMiddleware({
  params: idParam,
  body: updateTrackSchema,
});

exports.getTrackValidator = validatorMiddleware({
  params: idParam,
});

exports.deleteTrackValidator = validatorMiddleware({
  params: idParam,
});
