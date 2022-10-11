import BN, { TValue } from "../utils/BN";
import axios from "axios";
import { AGGREGATOR } from "../constants";
import blockchainService from "./blockchainService";
import { BEARER_TOKEN, SEED } from "../config";

export type TCalcRouteExchangeItem = {
  amountIn: number;
  amountOut: number;
  from: string;
  pool: string;
  to: string;
  type: string;
};

export type TCalcRoute = {
  exchanges: Array<TCalcRouteExchangeItem>;
  in: number;
};

export interface ICalcResponse {
  aggregatedProfit: number;
  estimatedOut: number;
  priceImpact: number;
  parameters: string;
  routes: Array<TCalcRoute>;
}

interface ICalcParams {
  token0: string;
  token1: string;
  amountIn: string;
}

type TCalcAmountInByAmountOutParams = Omit<ICalcParams, "amountIn"> & {
  amountOut: string;
};

const aggregatorService = {
  calc: async (params: ICalcParams): Promise<ICalcResponse> => {
    const { token0, token1, amountIn } = params;
    const url = `https://waves.puzzle-aggr-api.com/aggregator/calc?token0=${token0}&token1=${token1}&amountIn=${amountIn}`;
    const headers = {
      "Content-type": "application/json",
      Authorization: `Bearer ${BEARER_TOKEN}`,
    };
    const { data } = await axios.get(url, { headers });
    return data;
  },

  calcAmountInByAmountOut: async (params: TCalcAmountInByAmountOutParams) => {
    const { decimals: decimals0 } = await blockchainService
      .getAssetDetails(params.token0)
      .catch(() => ({ decimals: 8 }));

    const rate = await aggregatorService.calc({
      token0: params.token1,
      token1: params.token0,
      amountIn: BN.parseUnits(1, decimals0).toString(),
    });
    return BN.formatUnits(rate.estimatedOut, decimals0)
      .times(params.amountOut)
      .times(1.05)
      .toSignificant(0);
  },

  calcMinimumToReceive: (n: TValue) =>
    new BN(n).times(new BN(100 - 5).div(100)).toSignificant(0),

  swap: async (params: ICalcParams): Promise<any> => {
    const res = await aggregatorService.calc(params);
    return await blockchainService.invoke({
      seed: SEED,
      dApp: AGGREGATOR,
      args: [
        { type: "string", value: res.parameters },
        {
          type: "integer",
          value: aggregatorService
            .calcMinimumToReceive(res.estimatedOut)
            .toString(),
        },
      ],
      functionName: "swap",
      payment: [
        {
          assetId: params.token0,
          amount: params.amountIn.toString(),
        },
      ],
    });
  },
};

export default aggregatorService;
