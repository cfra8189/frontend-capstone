import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    email: { type: String, unique: true, sparse: true, default: null },
    passwordHash: { type: String, default: null },
    displayName: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
    role: { type: String, maxlength: 20, default: "artist" },
    businessName: { type: String, default: null },
    businessBio: { type: String, default: null },
    boxCode: { type: String, maxlength: 12, unique: true, sparse: true, default: null },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    githubId: { type: String, default: null },
}, { timestamps: true });
export const User = mongoose.model("User", userSchema);
