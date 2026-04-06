const globalError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  if (statusCode >= 500) {
    console.error(
      `[${new Date().toISOString()}] InternalError: ${err.name || "Error"} | ${
        err.message
      }`,
    );
  }

  const safeMessage =
    err.isOperational && err.message
      ? err.message
      : "حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا";

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};

module.exports = globalError;
