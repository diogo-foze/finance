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
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
