import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow nulls during migration but ensure uniqueness when present
    },
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    image: {
      type: String,
    },
    provider: {
      type: String,
      default: "credentials",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetCode: {
      type: String,
      select: false,
    },
    resetCodeExpiresAt: {
      type: Date,
      select: false,
    },
    loginCode: {
      type: String,
      select: false,
    },
    loginCodeExpiresAt: {
      type: Date,
      select: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
