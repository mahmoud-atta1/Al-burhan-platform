const asyncHandler = require("express-async-handler");
const Track = require("../models/track.model");
const ApiError = require("../utils/apiError");

exports.createTrack = asyncHandler(async (req, res, next) => {
  const track = await Track.create(req.body);

  res.status(201).json({
    success: true,
    data: track,
  });
});

exports.getTracks = asyncHandler(async (req, res) => {
  const tracks = await Track.find();

  res.status(200).json({
    success: true,
    results: tracks.length,
    data: tracks,
  });
});

exports.getTrack = asyncHandler(async (req, res, next) => {
  const track = await Track.findById(req.params.id);

  if (!track) return next(new ApiError("المسار غير موجود", 404));

  res.status(200).json({
    success: true,
    data: track,
  });
});

exports.updateTrack = asyncHandler(async (req, res, next) => {
  const track = await Track.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!track) return next(new ApiError("المسار غير موجود", 404));

  res.status(200).json({
    success: true,
    data: track,
  });
});

exports.deleteTrack = asyncHandler(async (req, res, next) => {
  const track = await Track.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true },
  );

  if (!track) return next(new ApiError("المسار غير موجود", 404));

  res.status(200).json({
    success: true,
    message: "تم حذف المسار بنجاح",
  });
});
