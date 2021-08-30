import { IDuckNft } from "../models/duckNft";
import axios from "axios";
import { IBid } from "../models/bid";
import {
  auctionDappAddress,
  farmingDappAddress,
  INodeResponse,
} from "../interfaces";

export const getDuckOnUserWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/assets/nft/${address}/limit/1000`;
  try {
    const { data }: INodeResponse<IDuckNft[]> = await axios.get(url);
    return data.filter((item) => /^DUCK/.test(item.name)).map((i) => i.assetId);
  } catch (e) {
    console.warn(e);
  }
};

export const getBidsOnUserWallet = async (address: string): Promise<IBid[]> => {
  const url = `https://wavesducks.com/api/blockchain/addresses/data/${auctionDappAddress}?matches=address_${address}_auction_(.*)_bid_(.*)`;
  try {
    const { data }: INodeResponse = await axios.get(url);
    return data.reduce((acc, { key, value }) => {
      const split = key.split("_");
      return [...acc, { auctionId: split[3], bidId: split[5], duckId: value }];
    }, []);
  } catch (e) {
    console.warn(e);
  }
};

export const getDuckOnFarmingRelatedToWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/addresses/data/${farmingDappAddress}?matches=^address_${address}_asset_(.*)_farmingPower$`;
  try {
    const { data }: INodeResponse = await axios.get(url);
    return data
      .filter((item) => +item.value > 0)
      .map((i) => i.key.split("_")[3]);
  } catch (e) {
    console.warn(e);
  }
};

export const getDuckOnAuctionRelatedToWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/addresses/data/${auctionDappAddress}?matches=^address_${address}_auction_(.*)_lockedNFT$`;
  try {
    const { data }: INodeResponse = await axios.get(url);
    if (!data) return [];
    return data.map((i) => i.value).filter((v) => !!v);
  } catch (e) {
    console.warn(e);
  }
};

const getDuckDetails = async (address: string): Promise<IDuckNft> =>
  (await axios.get(`https://wavesducks.com/api/v1/ducks/nft/${address}`)).data;

const getAuctionStatusAndBidsAmount = async (
  auctionId: string
): Promise<{
  auctionStatus: string;
  bidsAmount: number;
  highestBid: number;
}> => {
  const auctionStatus = (
    await axios.get(
      `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_status`
    )
  ).data[0].value;

  const bids = (
    await axios.get(
      `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_bid_(.*)_amount`
    )
  ).data;

  const highestBid = bids.reduce((prev, cur) => {
    return prev.value > cur.value ? prev.value : cur.value;
  }, 0);

  if (auctionId == "FG9dWTaWS7NvmAi1NnWkUda5DQLQt2Tp7QhVfJNvebxn") {
    return { bidsAmount: bids.length, auctionStatus: "finished", highestBid };
  }
  return { bidsAmount: bids.length, auctionStatus, highestBid };
};

const getBidDetails = async (initData: IBid): Promise<IBid> => {
  const [bidStatus, bidAmount, maxAmount, auctionStatus, duck] =
    await Promise.all([
      getBidStatus(initData.auctionId, initData.bidId),
      getBidAmount(initData.auctionId, initData.bidId),
      getMaxAmountOfAuction(initData.auctionId),
      getAuctionStatus(initData.auctionId),
      getDuckDetails(initData.duckId),
    ]);

  return {
    bidId: initData.bidId,
    duckId: initData.duckId,
    auctionId: initData.auctionId,
    bidStatus: bidStatus,
    bidAmount: bidAmount,
    maxAuctionAmount: maxAmount,
    auctionStatus: auctionStatus,
    duckName: duck.name,
  };
};

export const updateUserDetails = async (address: string) => {
  const [auctionDucksRaw, farmingDucksRaw, userDucksRaw, userBidsRaw] =
    await Promise.all([
      getDuckOnAuctionRelatedToWallet(address),
      getDuckOnFarmingRelatedToWallet(address),
      getDuckOnUserWallet(address),
      getBidsOnUserWallet(address),
    ]);

  const [farmingDucks, auctionDucks, userDucks, bids] = await Promise.all([
    Promise.all(
      farmingDucksRaw.map(async (assetId) => ({
        ...(await getDuckDetails(assetId)),
      }))
    ),
    Promise.all(
      auctionDucksRaw.map(async (assetId) => {
        const details = await getDuckDetails(assetId);
        const auctionDetails = await getAuctionStatusAndBidsAmount(
          details.auctionId
        );
        //todo получаем биды и по их изменению смотрим появились ли новые ставки, отменились ли старые
        return { ...details, ...auctionDetails };
      })
    ),
    Promise.all(
      userDucksRaw.map(async (assetId) => ({
        ...(await getDuckDetails(assetId)),
      }))
    ),
    Promise.all(
      userBidsRaw.map(async (bid) => ({
        ...(await getBidDetails(bid)),
      }))
    ),
  ]);
  return { farmingDucks, auctionDucks, userDucks, bids };
};

//todo make
const getBidStatus = async (auctionId: string, bidId: string) => {
  let url = `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_bid_${bidId}_status`;
  const bidStatus = await axios.get(url);
  return bidStatus.data[0].value;
};

const getAuctionStatus = async (auctionId: string) => {
  const url = `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_status`;
  const auctionStatus = await axios.get(url);
  return auctionStatus.data[0].value;
};

const getBidAmount = async (auctionId: string, bidId: string) => {
  let url = `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_bid_${bidId}_amount`;
  const bidAmount = await axios.get(url);
  return bidAmount.data[0].value;
};

const getMaxAmountOfAuction = async (auctionId: string) => {
  let url = `https://wavesducks.com/api/blockchain/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=auction_${auctionId}_bid_(.*)_amount`;
  const maxAmount = await axios.get(url);
  return maxAmount.data.reduce((prev, cur) => {
    return prev.value > cur.value ? prev.value : cur.value;
  }, 0);
};
