import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Server is flying!
📡 URL: http://localhost:${PORT}
🛠️  Mode: ${process.env.NODE_ENV || "development"}
  `);
});
