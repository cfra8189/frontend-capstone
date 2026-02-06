import mongoose, { Schema } from "mongoose";
const projectSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, maxlength: 255 },
    type: { type: String, maxlength: 50, default: "single" },
    status: { type: String, maxlength: 50, default: "concept" },
    description: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isFeatured: { type: Boolean, default: false },
}, { timestamps: true });
export const Project = mongoose.model("Project", projectSchema);
