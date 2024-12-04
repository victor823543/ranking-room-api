import { Schema, Types, model } from "mongoose";

export type IPin = {
  userId: Types.ObjectId;
  roomId: Types.ObjectId;
};

const schema = new Schema<IPin>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});

export const Pin = model<IPin>("Pin", schema);
