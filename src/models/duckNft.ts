export interface IDuckNft {
  assetId?: string;
  issueHeight?: number;
  issueTimestamp?: number;
  issuer?: string;
  issuerPublicKey?: string;
  name?: string;
  description?: string;
  decimals?: number;
  reissuable?: boolean;
  quantity?: number;
  scripted?: boolean;
  minSponsoredAssetFee?: string | null;
  originTransactionId?: string;
  canBreed?: boolean;
  achievements?: {
    a: string[];
    n: number;
  };
  onSale?: boolean;
  owner?: string;
  onFarming?: boolean;
  perchColor?: string | null;
  auctionId?: string;
  farmingParams?: {
    lastCheckFarmedAmount?: number;
    withdrawnAmount?: number;
    assetLastCheckInterest?: number;
    farmingPower?: number;
    total_lastCheckInterest?: number;
    total_lastCheckInterestHeight?: number;
    total_farmingPower?: number;
    blockchainHeight?: number;
    currentInterest?: number;
  };
  toClaim?: number;
  ducksWithSameGenesAndColor?: number;
  ducksWithSameGenesAndOrder?: number;
  ducksWithSameGenes?: number;
  rarity?: number;
  REWARD_PER_BLOCK?: number;
  SCALE?: number;
  total_farmingPower?: number;
  eggProduction?: string;
  startPrice?: number;
  auctionStatus?: string;
  bidsAmount?: number;
  highestBid?: number;
}

const FarmingParamsSchema = {
  type: {
    lastCheckFarmedAmount: { type: Number, required: false },
    withdrawnAmount: { type: Number, required: false },
    assetLastCheckInterest: { type: Number, required: false },
    farmingPower: { type: Number, required: false },
    total_lastCheckInterest: { type: Number, required: false },
    total_lastCheckInterestHeight: { type: Number, required: false },
    total_farmingPower: { type: Number, required: false },
    blockchainHeight: { type: Number, required: false },
    currentInterest: { type: Number, required: false },
  },
  required: false,
};

const AchievementsSchema = {
  type: {
    a: { type: [String], required: false },
    n: { type: Number, required: false },
  },
  required: false,
};

export const DuckNftSchema = {
  type: {
    assetId: { type: String, required: false },
    issueHeight: { type: Number, required: false },
    issueTimestamp: { type: Number, required: false },
    issuer: { type: String, required: false },
    issuerPublicKey: { type: String, required: false },
    name: { type: String, required: false },
    description: { type: String, required: false },
    decimals: { type: Number, required: false },
    reissuable: { type: Boolean, required: false },
    quantity: { type: Number, required: false },
    scripted: { type: Boolean, required: false },
    minSponsoredAssetFee: { type: Number, required: false },
    originTransactionId: { type: String, required: false },
    onSale: { type: Boolean, required: false },
    owner: { type: String, required: false },
    onFarming: { type: Boolean, required: false },
    perchColor: { type: String, required: false },
    toClaim: { type: Number, required: false },
    ducksWithSameGenesAndColor: { type: Number, required: false },
    ducksWithSameGenesAndOrder: { type: Number, required: false },
    ducksWithSameGenes: { type: Number, required: false },
    rarity: { type: Number, required: false },
    REWARD_PER_BLOCK: { type: Number, required: false },
    SCALE: { type: Number, required: false },
    total_farmingPower: { type: Number, required: false },
    eggProduction: { type: String, required: false },
    startPrice: { type: Number, required: false },
    auctionId: { type: String, required: false },
    farmingParams: FarmingParamsSchema,
    achievements: AchievementsSchema,
    auctionStatus: { type: String, required: false },
    bidsAmount: { type: Number, required: false },
    highestBid: { type: Number, required: false },
  },
  required: false,
};
