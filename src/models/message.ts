import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface IMessage {
  userId: number;
  message: string;
}

export type TMessageDocument = Document & IMessage;

const MessageSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: false },
    message: { type: String, required: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<TMessageDocument>(
  "Message",
  MessageSchema
);
