import makeNodeRequest, {
  INodeResponse,
  TDataEntry,
} from "../utils/makeNodeRequest";
import BN from "../utils/BN";
import { getStateByKey } from "../utils/getStateByKey";
import { LIMIT_ORDERS } from "../constants";

export type TOrderStatus = "active" | "closed" | "canceled";

export interface IOrder {
  id: string;
  amount0: BN;
  token0: string;
  amount1: BN;
  token1: string;
  fulfilled0: BN;
  fulfilled1: BN;
  status: TOrderStatus;
}

export const getActiveOrdersIds = async () => {
  const req = `/addresses/data/${LIMIT_ORDERS}?matches=order_(.*)_status`;
  let { data } = await makeNodeRequest(req);
  return (data as TDataEntry[])
    .filter(({ value }) => value === "active")
    .map(({ key }) => key.split("_")[1]);
};

export const getOrderById = async (id: string): Promise<IOrder> => {
  const req = `/addresses/data/${LIMIT_ORDERS}?matches=order_${id}_(.*)`;
  let { data } = await makeNodeRequest(req);
  return {
    id,
    amount0: new BN(getStateByKey(data, `order_${id}_amount0`) ?? 0),
    token0: getStateByKey(data, `order_${id}_token0`) ?? "",
    amount1: new BN(getStateByKey(data, `order_${id}_amount1`) ?? 0),
    token1: getStateByKey(data, `order_${id}_token1`) ?? "",
    fulfilled0: new BN(getStateByKey(data, `order_${id}_fulfilled0`) ?? 0),
    fulfilled1: new BN(getStateByKey(data, `order_${id}_fulfilled1`) ?? 0),
    status: (getStateByKey(data, `order_${id}_status`) ??
      "closed") as TOrderStatus,
  };
};
