import {
  getDuckOnActionRelatedToWallet,
  getDuckOnFarmingRelatedToWallet,
} from "./services/statsService";

const address = "3P6yAofopEV6QzNz282rDaUyfywe4UjVHdx";
const foo = async () => {
  const wallets = [{ walletAddress: address }];

  await Promise.all(
    wallets.map(async ({ walletAddress }) => {
      const [auctionDucks, farmingDucks] = await Promise.all([
        getDuckOnActionRelatedToWallet(walletAddress),
        getDuckOnFarmingRelatedToWallet(walletAddress),
      ]);
      console.log(auctionDucks, farmingDucks);
      return { auctionDucks, farmingDucks };
    })
  );
};

foo();
