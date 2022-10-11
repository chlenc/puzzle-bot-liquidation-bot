import makeNodeRequest from "../utils/makeNodeRequest";
import { POOLS } from "../constants";

class WatcherService {
  lastTxs: Record<string, string> = {};
  constructor() {
    Promise.all(
      POOLS.map((pool) => {
        const req = `/transactions/address/${pool}/limit/1`;
        return makeNodeRequest(req).then(({ data }) => ({
          pool,
          id: data[0][0].id,
        }));
      })
    ).then((data) => {
      this.lastTxs = data.reduce(
        (acc, item) => ({ ...acc, [item.pool]: item.id }),
        {} as Record<string, string>
      );
    });
  }
  getUnsentData = async () => {
    const lastTxsArr = Object.entries(this.lastTxs);
    const result = await Promise.all(
      lastTxsArr.map(async ([pool, lastTx]) => {
        const req = `/transactions/address/${pool}/limit/200`;
        const rawTxs = await makeNodeRequest(req).then(({ data }) => data[0]);
        const lastTxIndex = rawTxs.findIndex((tx: any) => tx.id === lastTx);
        const txs = rawTxs.filter(
          (tx: any, index: number) =>
            index < lastTxIndex &&
            tx?.call?.function != null &&
            ["supply", "borrow", "repay", "withdraw"].includes(tx.call.function)
        );
        return { pool, txs };
      })
    );
    this.lastTxs = result.reduce(
      (acc, item, index) => ({
        ...acc,
        [item.pool]:
          item.txs.length > 0 ? item.txs[0].id : lastTxsArr[index][1],
      }),
      {} as Record<string, string>
    );
    return result;
  };
  // getUnsentData = async (pools: string[]) => {
  //   const height = this.height;
  //   await Promise.all(
  //     pools.map(async (pool) => {
  //       const lastTxReq = `/transactions/address/${pool}/limit/1`;
  //       const lastTx = await makeNodeRequest(lastTxReq);
  //       const txs = await makeNodeRequest(
  //         `/transactions/address/${pool}/limit/1000?after=${height}`
  //       ).then(({ data }) => data);
  //     })
  //   );
  //   // const data = await makeNodeRequest(
  //   //   `/transactions/address/${address}/limit/1000?after=${height}`
  //   // );
  //   if (data == null) return [];
  //   const result = data.filter(({ issueTimestamp }) => {
  //     return issueTimestamp > lastTimestamp;
  //   });
  //   this.issueTimestamp = data[data.length - 1].issueTimestamp;
  //   return result;
  // };
  //
  // private getData = async () => {
  //   try {
  //     const idsReq =
  //       "/addresses/data/3PFQjjDMiZKQZdu5JqTHD7HwgSXyp9Rw9By?matches=collection_3PGKEe4y59V3WLnHwPEUaMWdbzy8sb982fG_.waves_assetId_(.*)";
  //     const { data: idsRes } = await makeNodeRequest(idsReq);
  //     const ids = idsRes.map(({ value }) => value);
  //     const { data: detailsRes } = await makeNodeRequest(`/assets/details`, {
  //       postData: { ids },
  //     });
  //     return detailsRes.sort((x, y) => x.issueTimestamp - y.issueTimestamp);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };
}

export default new WatcherService();
