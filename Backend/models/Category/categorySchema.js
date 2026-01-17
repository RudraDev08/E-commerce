import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      default: ""
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    level: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

/* ---------------- AUTO SLUG ---------------- */
categorySchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true
    });
  }
});

/* ---------------- AUTO LEVEL ---------------- */
categorySchema.pre("save", async function () {
  if (this.parentId) {
    const parent = await this.constructor.findById(this.parentId);
    this.level = parent ? parent.level + 1 : 1;
  } else {
    this.level = 1;
  }
});

export default mongoose.model("Category", categorySchema);
