import mongoose, { Schema } from "mongoose";
const communityCommentSchema = new Schema({
    sharedContentId: { type: Schema.Types.ObjectId, ref: "SharedContent", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
}, { timestamps: true });
export const CommunityComment = mongoose.model("CommunityComment", communityCommentSchema);
