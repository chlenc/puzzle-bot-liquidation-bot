import {
  getDuckOnActionRelatedToWallet,
  getDuckOnFarmingRelatedToWallet,
  updateDuckForUser,
} from "./services/statsService";

const address = "3P6yAofopEV6QzNz282rDaUyfywe4UjVHdx";
const foo = async () => {
  const res = await updateDuckForUser("3P9qHM9jLsxdZrxjkNX7JPfScXDeZM3WKEP");
  console.log(res);
};

foo();
