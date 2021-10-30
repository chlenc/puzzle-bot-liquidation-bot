import axios from "axios";

export interface IDuck {
  timestamp: number;
  duckName: string;
  amount: number; //waves
  NFT: string;
  date: string;
  buyType: "instantBuy" | "acceptBid";
}

export interface IAuctionDuck {
  achievements?: string;
  rawAchievements?: string;
  timestamp?: number;
  duckName?: string;
  duckNr?: number;
  duckRealName?: string;
  NFT?: string;
  date?: string;
  buyType?: string;
  auctionId?: string;
  hasChildren?: number;
  rarity?: number;
  amount?: number;
}

type TRespData = { data: { auctionData: IAuctionDuck[] } };

class WatcherService {
  timestamp = new Date().getTime();

  constructor() {
    this.getData().then((data) => {
      this.timestamp = data[data.length - 1].timestamp;
    });
  }

  getUnsentData = async () => {
    const lastTimestamp = this.timestamp;
    const data = await this.getData();
    if (data) this.timestamp = data[data.length - 1].timestamp;
    return data.filter(({ timestamp }) => timestamp > lastTimestamp);
  };

  private getData = async () => {
    try {
      const { data }: TRespData = await axios.get(
        "https://node2.duxplorer.com/auction/json"
      );
      if (!data.auctionData) return;
      return data.auctionData.sort((x, y) => x.timestamp - y.timestamp);
    } catch (e) {
      console.log(e);
    }
  };
}

export default new WatcherService();
