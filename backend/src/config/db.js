const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: Number(
        process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 5000,
      ),
    });
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = dbConnection;
