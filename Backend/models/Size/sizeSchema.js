import mongoose from "mongoose";
import slugify from "slugify";

const sizeSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    sizeName: {
      type: String,
      required: true,
      trim: true
    },

    sizeValue: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: Boolean,
      default: true // Active
    }
  },
  { timestamps: true }
);

sizeSchema.pre("save", function (next) {
  this.slug = slugify(`${this.category}-${this.code}`, { lower: true });
  next();
});

export default mongoose.model("Size", sizeSchema);
