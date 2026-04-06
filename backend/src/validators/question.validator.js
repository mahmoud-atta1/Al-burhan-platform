const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const validateSingleCorrectOption = (value, helpers) => {
  const correctCount = value.filter((option) => option.isCorrect).length;

  if (correctCount !== 1) {
    return helpers.error("array.singleCorrect");
  }

  return value;
};

const optionSchema = Joi.object({
  text: Joi.string().trim().min(1).required().messages({
    "string.empty": "نص الاختيار مطلوب",
  }),
  isCorrect: Joi.boolean().required(),
}).unknown(false);

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID السؤال غير صالح",
    "any.required": "ID السؤال مطلوب",
  }),
  examId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الامتحان غير صالح",
    "any.required": "ID الامتحان مطلوب",
  }),
  weekId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الأسبوع غير صالح",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const examParam = Joi.object({
  examId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الامتحان غير صالح",
    "any.required": "ID الامتحان مطلوب",
  }),
  weekId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الأسبوع غير صالح",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const createQuestionSchema = Joi.object({
  questionText: Joi.string().trim().min(3).required().messages({
    "string.empty": "نص السؤال مطلوب",
  }),

  options: Joi.array()
    .items(optionSchema)
    .min(2)
    .required()
    .custom(validateSingleCorrectOption)
    .messages({
      "array.min": "لازم يكون فيه اختيارين على الأقل",
      "array.singleCorrect": "لازم يكون فيه اختيار صحيح واحد فقط",
    }),

  mark: Joi.number().min(1).required().messages({
    "number.base": "درجة السؤال يجب أن تكون رقم",
    "number.min": "درجة السؤال يجب أن تكون 1 على الأقل",
    "any.required": "درجة السؤال مطلوبة",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

const updateQuestionSchema = Joi.object({
  questionText: Joi.string().trim().min(3).messages({
    "string.min": "نص السؤال يجب أن يكون 3 أحرف على الأقل",
  }),

  options: Joi.array()
    .items(optionSchema)
    .min(2)
    .custom(validateSingleCorrectOption)
    .messages({
      "array.min": "لازم يكون فيه اختيارين على الأقل",
      "array.singleCorrect": "لازم يكون فيه اختيار صحيح واحد فقط",
    }),

  mark: Joi.number().min(1).messages({
    "number.base": "درجة السؤال يجب أن تكون رقم",
    "number.min": "درجة السؤال يجب أن تكون 1 على الأقل",
  }),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

exports.getQuestionsValidator = validatorMiddleware({
  params: examParam,
});

exports.createQuestionValidator = validatorMiddleware({
  params: examParam,
  body: createQuestionSchema,
});

exports.getQuestionValidator = validatorMiddleware({
  params: idParam,
});

exports.updateQuestionValidator = validatorMiddleware({
  params: idParam,
  body: updateQuestionSchema,
});

exports.deleteQuestionValidator = validatorMiddleware({
  params: idParam,
});
