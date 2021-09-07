import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface IMessage {
  userId: number;
  message: string;
}

export type TMessageDocument = Document & IMessage;

const MessageSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, default: "" },
    message: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

export const Message = mongoose.model<TMessageDocument>(
  "Message",
  MessageSchema
);
