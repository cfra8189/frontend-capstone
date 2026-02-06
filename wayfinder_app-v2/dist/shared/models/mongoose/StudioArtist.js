import mongoose, { Schema } from "mongoose";
const studioArtistSchema = new Schema({
    studioId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, maxlength: 20, default: "pending" },
    inviteEmail: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
}, { timestamps: true });
export const StudioArtist = mongoose.model("StudioArtist", studioArtistSchema);
