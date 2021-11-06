import * as mongoose from "mongoose";
import { Document } from "mongoose";
import { DuckNftSchema, IDuckNft } from "./duckNft";
import { BidSchema, IBid } from "./bid";

export interface ITelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface IUserParams {
  walletAddress?: string;
  userDucks?: IDuckNft[];
  farmingDucks?: IDuckNft[];
  auctionDucks?: IDuckNft[];
  bids?: IBid[];
  messagesNumber?: number;
  messageHistory?: string;
  invitationChannel?: string;
  lastActivityDate?: Date;
  ref?: number;
  myRefs?: number[];
  state?: string | number;
  balance: string;
}

export interface IReferralParams {
  lang: "ENG" | "RUS" | "SPA";
}

export type TUserDocument = Document &
  ITelegramUser &
  IUserParams &
  IReferralParams;

const UserSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    is_bot: { type: Boolean, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    walletAddress: { type: String, required: false },
    userDucks: DuckNftSchema,
    farmingDucks: DuckNftSchema,
    auctionDucks: DuckNftSchema,
    bids: BidSchema,
    messagesNumber: { type: Number, required: false, default: 1 },
    messageHistory: { type: String, required: false },
    invitationChannel: { type: String, required: false },
    lastActivityDate: { type: Date, required: false, default: new Date() },
    lang: { type: String, required: true, default: "ENG" },
    ref: { type: Number, required: false },
    myRefs: { type: Number, required: false },
    state: { type: String, required: false },
    balance: { type: Number, required: false, default: "0" },
  },
  { timestamps: true }
);

export const User = mongoose.model<TUserDocument>("User", UserSchema);
