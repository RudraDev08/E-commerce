import dotenv from "dotenv";
dotenv.config();

const env = {
  uploadPath: process.env.CATEGORY_UPLOAD_PATH || "src/uploads/categories",
};

export default env;
