import { model, Schema, Types } from "mongoose";

export type IImage = {
  _id: Types.ObjectId;
  url: string;
  user: Types.ObjectId;
  timestamp: number;
};

const schema = new Schema<IImage>({
  url: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const Image = model<IImage>("Image", schema);
