import { model, Schema, Types } from "mongoose";

export type IFriendRequest = {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  timestamp: number;
};

const schema = new Schema<IFriendRequest>({
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const FriendRequest = model<IFriendRequest>("FriendRequest", schema);
