export interface IBid {
  bidId?: string;
  duckId?: string;
  auctionId?: string;
  bidStatus?: string;
  bidAmount?: number;
  maxAuctionAmount?: number;
  auctionStatus?: string;
  duckName?: string;
}

export const BidSchema = {
  type: {
    bidId: { type: String, required: false },
    duckId: { type: String, required: false },
    auctionId: { type: String, required: false },
    bidAmount: { type: Number, required: false },
    maxAuctionAmount: { type: Number, required: false },
    bidStatus: { type: String, required: false },
    auctionStatus: { type: String, required: false },
    duckName: { type: String, required: false },
  },
  required: false,
};
