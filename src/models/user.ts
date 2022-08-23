import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface ITelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface IUserParams {
  assets: { assetId: string; percent: number; lastPrice: number }[];
  walletAddress?: string;
  messagesNumber?: number;
  messageHistory?: string;
  invitationChannel?: string;
  lastActivityDate?: Date;
  ref?: number;
  myRefs?: number[];
  state?: {
    key: string;
    data: Record<string, any>;
  };
  balance: string;
}

export type TUserDocument = Document & ITelegramUser & IUserParams;

const UserSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    is_bot: { type: Boolean, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    walletAddress: { type: String, required: false },
    messagesNumber: { type: Number, required: false, default: 1 },
    messageHistory: { type: String, required: false },
    invitationChannel: { type: String, required: false },
    lastActivityDate: { type: Date, required: false, default: new Date() },
    lang: { type: String, required: true, default: "ENG" },
    ref: { type: Number, required: false },
    myRefs: { type: Number, required: false },
    assets: [
      {
        assetId: { type: String, required: true },
        percent: { type: Number, required: true },
        lastPrice: { type: Number, required: true },
      },
    ],
    state: {
      type: {
        key: { type: String, required: true },
        data: { type: String, required: false },
      },
      required: false,
    },
    balance: { type: Number, required: false, default: "0" },
  },
  { timestamps: true }
);

export const User = mongoose.model<TUserDocument>("User", UserSchema);
