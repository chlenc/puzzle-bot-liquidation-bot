import { IDuckNft } from "../models/duckNft";
import { getDuckName } from "../utils";
import { IBid } from "../models/bid";

const significantChangeOfRarity = 1;

export const compareFarmingDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string => {
  return lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    if (
      current != null &&
      last.farmingParams != null &&
      current.farmingParams != null &&
      last.farmingParams.farmingPower !== current.farmingParams.farmingPower
    ) {
      const duckName = getDuckName(current.name, namesDictionary);
      const duckLink = `https://wavesducks.com/duck/${current.assetId}`;
      acc += `Farming power of duck (${duckName})[${duckLink}] has been changed from ${last.farmingParams.farmingPower}
       to ${current.farmingParams.farmingPower}\n`;
    }
    return acc;
  }, "" as string);
};

export const compareRarityOfDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string =>
  lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    if (
      current != null &&
      last.rarity !== current.rarity &&
      Math.abs(last.rarity - current.rarity) > significantChangeOfRarity
    ) {
      const duckName = getDuckName(current.name, namesDictionary);
      const duckLink = `https://wavesducks.com/duck/${current.assetId}`;
      acc += `Rarity of duck (${duckName})[${duckLink}] has been changed from ${last.rarity.toFixed()} to ${current.rarity.toFixed()}\n`;
    }
    return acc;
  }, "" as string);

export const compareAuctionDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string => {
  return lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    let duckName = "";
    let duckLink = "";
    if (!Object.is(current, last)) {
      duckName = getDuckName(current.name, namesDictionary);
      duckLink = `https://wavesducks.com/duck/${current.assetId}`;
    }
    if (
      last.auctionStatus !== current.auctionStatus &&
      current.auctionStatus === "finished"
    ) {
      acc += `Your duck [${duckName}](${duckLink}) has been bought by someone! Congratulations! 🎉`;
    }
    if (last.highestBid !== current.highestBid) {
      acc += `Your duck [${duckName}](${duckLink}) has gotten new bid`;
    }

    return acc;
  }, "" as string);
};

export const compareUserBids = (
  lastArray: IBid[],
  currentArray: IBid[],
  namesDictionary
): string =>
  lastArray.reduce((acc, last) => {
    const current = currentArray.find(({ bidId }) => bidId === last.bidId);
    if (current == null) return;
    let name = "";
    let duckLink = "";
    if (!Object.is(last, current)) {
      name = getDuckName(current.duckName, namesDictionary);
      duckLink = `https://wavesducks.com/duck/${current.duckId}`;
    }
    if (
      last.bidStatus !== current.bidStatus &&
      current.bidStatus === "cancelled"
    ) {
      acc += `Your bid on [${name}](${duckLink}) has been cancelled`;
    }
    if (
      last.maxAuctionAmount !== current.maxAuctionAmount &&
      current.bidAmount !== last.maxAuctionAmount
    ) {
      console.log("❗here is potential spam problem️❗️");
      console.log("last", last);
      console.log("current", current);
      // acc += `New bid for [${name}](${duckLink}) that is bigger than your has been added`;
    }
    if (last.auctionStatus !== current.auctionStatus) {
      if (current.auctionStatus === "finished") {
        acc += `[${name}](${duckLink}) that you were trying to buy has been sold`;
      }
      if (current.auctionStatus === "cancelled") {
        acc += `[${name}}](${duckLink}) that you were trying to buy is not on auction anymore`;
      }
    }

    return acc;
  }, "" as string);

export const compareAllFields = (
  newData: {
    farmingDucks: IDuckNft[];
    auctionDucks: IDuckNft[];
    userDucks: IDuckNft[];
    bids;
  },
  oldData: {
    lastFarmingDucks: IDuckNft[];
    lastUserDucks: IDuckNft[];
    lastBids: IBid[];
    lastAuctionDucks: IDuckNft[];
  },
  dict
): string => {
  let message = "";

  //fixme farming
  if (oldData.lastFarmingDucks != null && newData.farmingDucks != null) {
    message += compareFarmingDucks(
      oldData.lastFarmingDucks,
      newData.farmingDucks,
      dict
    );
  }

  //fixme bids for duck owner
  if (newData.auctionDucks != null && oldData.lastAuctionDucks) {
    message += compareAuctionDucks(
      oldData.lastAuctionDucks,
      newData.auctionDucks,
      dict
    );
  }

  //fixme rarity
  message += compareRarityOfDucks(
    [].concat(
      oldData.lastFarmingDucks || [],
      oldData.lastAuctionDucks || [],
      oldData.lastUserDucks || []
    ),
    [].concat(newData.farmingDucks, newData.auctionDucks, newData.userDucks),
    dict
  );

  //fixme bid
  if (newData.bids != null && oldData.lastBids != null) {
    message += compareUserBids(oldData.lastBids, newData.bids, dict);
  }
  return message;
};
