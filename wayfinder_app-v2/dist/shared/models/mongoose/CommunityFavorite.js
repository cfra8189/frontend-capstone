import mongoose, { Schema } from "mongoose";
const communityFavoriteSchema = new Schema({
    sharedContentId: { type: Schema.Types.ObjectId, ref: "SharedContent", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export const CommunityFavorite = mongoose.model("CommunityFavorite", communityFavoriteSchema);
