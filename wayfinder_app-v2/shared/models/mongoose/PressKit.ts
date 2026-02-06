import mongoose, { Schema, Document } from "mongoose";

export interface IPressKit extends Document {
  userId: mongoose.Types.ObjectId;
  shortBio: string | null;
  mediumBio: string | null;
  longBio: string | null;
  genre: string | null;
  location: string | null;
  photoUrls: string[];
  videoUrls: string[];
  featuredTracks: any[];
  achievements: any[];
  pressQuotes: any[];
  socialLinks: Record<string, any>;
  contactEmail: string | null;
  contactName: string | null;
  bookingEmail: string | null;
  technicalRider: string | null;
  stagePlot: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pressKitSchema = new Schema<IPressKit>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  shortBio: { type: String, default: null },
  mediumBio: { type: String, default: null },
  longBio: { type: String, default: null },
  genre: { type: String, maxlength: 100, default: null },
  location: { type: String, maxlength: 255, default: null },
  photoUrls: { type: [String], default: [] },
  videoUrls: { type: [String], default: [] },
  featuredTracks: { type: Array, default: [] },
  achievements: { type: Array, default: [] },
  pressQuotes: { type: Array, default: [] },
  socialLinks: { type: Schema.Types.Mixed, default: {} },
  contactEmail: { type: String, default: null },
  contactName: { type: String, default: null },
  bookingEmail: { type: String, default: null },
  technicalRider: { type: String, default: null },
  stagePlot: { type: String, default: null },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

export const PressKit = mongoose.model<IPressKit>("PressKit", pressKitSchema);
