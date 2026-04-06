const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const validateUniqueQuestions = (answers, helpers) => {
  const questionIds = answers.map((answer) => answer.questionId);

  if (new Set(questionIds).size !== questionIds.length) {
    return helpers.error("array.duplicateQuestions");
  }

  return answers;
};

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

const submitAttemptSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().hex().length(24).required().messages({
          "string.hex": "ID السؤال غير صالح",
          "any.required": "ID السؤال مطلوب",
        }),
        selectedOption: Joi.number().integer().min(0).required().messages({
          "number.base": "الاختيار يجب أن يكون رقم",
          "number.min": "الاختيار يجب أن يكون صفر أو أكبر",
          "any.required": "الاختيار مطلوب",
        }),
      }).unknown(false),
    )
    .min(1)
    .required()
    .custom(validateUniqueQuestions)
    .messages({
      "array.min": "لازم تبعت إجابة واحدة على الأقل",
      "array.duplicateQuestions": "لا يمكن تكرار نفس السؤال في الإجابات",
      "any.required": "الإجابات مطلوبة",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

exports.submitExamAttemptValidator = validatorMiddleware({
  params: examParam,
  body: submitAttemptSchema,
});

exports.startExamAttemptValidator = validatorMiddleware({
  params: examParam,
});

exports.getMyExamAttemptValidator = validatorMiddleware({
  params: examParam,
});

exports.getExamAttemptsValidator = validatorMiddleware({
  params: examParam,
});
