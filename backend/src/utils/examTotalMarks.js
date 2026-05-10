const mongoose = require("mongoose");

const Exam = require("../models/exam.model");
const Question = require("../models/question.model");

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(value);

exports.calculateExamTotalMarks = async (examId) => {
  const [result] = await Question.aggregate([
    { $match: { examId: toObjectId(examId) } },
    { $group: { _id: "$examId", totalMarks: { $sum: "$mark" } } },
  ]);

  return result ? result.totalMarks : 0;
};

exports.calculateExamsTotalMarks = async (examIds) => {
  if (!examIds || !examIds.length) return new Map();

  const objectIds = examIds.map(toObjectId);

  const results = await Question.aggregate([
    { $match: { examId: { $in: objectIds } } },
    { $group: { _id: "$examId", totalMarks: { $sum: "$mark" } } },
  ]);

  return new Map(results.map((r) => [r._id.toString(), r.totalMarks]));
};

exports.syncExamTotalMarks = async (examId) => {
  const totalMarks = await exports.calculateExamTotalMarks(examId);
  await Exam.updateOne({ _id: examId }, { $set: { totalMarks } });
  return totalMarks;
};

