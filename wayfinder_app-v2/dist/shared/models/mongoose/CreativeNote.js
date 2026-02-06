import mongoose, { Schema } from "mongoose";
const creativeNoteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, maxlength: 50, default: "ideas" },
    title: { type: String, maxlength: 255, default: null },
    content: { type: String, required: true },
    mediaUrls: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isPinned: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
export const CreativeNote = mongoose.model("CreativeNote", creativeNoteSchema);
