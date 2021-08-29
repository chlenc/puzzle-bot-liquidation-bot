export type TDataEntry = { key: string; type: string; value: string };

export interface INodeResponse<T = TDataEntry[]> {
  data: T;
}

export interface IDuck {
  timestamp: number;
  duckName: string;
  amount: number; //waves
  NFT: string;
  date: string;
  buyType: "instantBuy" | "acceptBid";
}

export interface IHatchDuck {
  date: Date;
  timestamp: number;
  NFT: string;
  duckPrice: number;
  duckName: string;
}

export type TAuctionRespData = { data: { auctionData: IDuck[] } };
export type THatchingRespData = { data: { duckData: IHatchDuck[] } };

//
export const decimals = 1e8;
export const farmingDappAddress = "3PAETTtuW7aSiyKtn9GuML3RgtV1xdq1mQW";
export const auctionDappAddress = "3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG";
