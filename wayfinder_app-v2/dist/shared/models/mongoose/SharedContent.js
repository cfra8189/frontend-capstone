import mongoose, { Schema } from "mongoose";
const sharedContentSchema = new Schema({
    noteId: { type: Schema.Types.ObjectId, ref: "CreativeNote", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, maxlength: 20, default: "pending" },
    adminNotes: { type: String, default: null },
    blogPostId: { type: Schema.Types.ObjectId, ref: "BlogPost", default: null },
    approvedAt: { type: Date, default: null },
}, { timestamps: true });
export const SharedContent = mongoose.model("SharedContent", sharedContentSchema);
