import { Schema, Types, model } from "mongoose";

export type IUser = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password_hash: string | null;
  googleId: string | null; // To store the Google ID
  provider: UserProvider; // To distinguish between 'google' and 'local' logins
  friends: Types.ObjectId[]; // To store the friends' IDs
  timestamp: number;
};

export enum UserProvider {
  GOOGLE = "GOOGLE",
  LOCAL = "LOCAL",
}

export type TokenPayload = {
  _id: string;
  email: string;
  username: string;
  timestamp: number;
};

const schema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password_hash: {
    type: String,
    required: false, // Password can be null for Google login users
    default: null,
  },
  googleId: {
    type: String,
    required: false, // Only needed for Google login users
    default: null,
  },
  provider: {
    type: String,
    required: true,
    enum: ["LOCAL", "GOOGLE"], // Local login or Google login
    default: UserProvider.LOCAL,
  },
  friends: {
    type: [Schema.Types.ObjectId],
    required: false,
    default: [],
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const User = model<IUser>("User", schema);
