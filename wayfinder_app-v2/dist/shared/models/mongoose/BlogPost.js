import mongoose, { Schema } from "mongoose";
const blogPostSchema = new Schema({
    sharedContentId: { type: Schema.Types.ObjectId, ref: "SharedContent", default: null },
    title: { type: String, required: true, maxlength: 255 },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
}, { timestamps: true });
export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
