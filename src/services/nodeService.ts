import makeNodeRequest from "../utils/makeNodeRequest";

export interface INodeData {
  key: string;
  type: "integer" | "string";
  value: number | string;
}

export interface IAsset {
  assetId: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  name: string;
  description: string;
  decimals: number;
  reissuable: boolean;
  quantity: number;
  scripted: boolean;
  minSponsoredAssetFee: null | number;
  originTransactionId: string;
}

export interface INFT {
  assetId: string;
  decimals: number;
  description: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  minSponsoredAssetFee: null | any;
  name: string;
  originTransactionId: string;
  quantity: number;
  reissuable: boolean;
  scripted: boolean;
  typeId?: string;
}

interface IBalance {
  assetId: string;
  balance: number;
}

interface IAssetDetails {
  assetId: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  name: string;
  description: string;
  decimals: number;
  reissuable: boolean;
  quantity: number;
  scripted: boolean;
  minSponsoredAssetFee: null | any;
  originTransactionId: string;
}

const nodeService = {
  getAddressNfts: async (address: string): Promise<INFT[]> => {
    const url = `/assets/nft/${address}/limit/1000`;
    const { data } = await makeNodeRequest(url);
    return data;
  },
  evaluate: async (
    address: string,
    expression: string
  ): Promise<IEvaluateScript> => {
    const url = `/utils/script/evaluate/${address}`;
    const { data } = await makeNodeRequest(url, {
      postData: { expr: expression },
    });
    return data;
  },
  getAssetDetails: async (assetId: string): Promise<IAsset | null> => {
    const url = `/assets/details/${assetId}`;
    const { data } = await makeNodeRequest(url);
    return data;
  },
  getAddressBalances: async (address: string | null): Promise<IBalance[]> => {
    if (address == null) return [];
    const assetsUrl = `/assets/balance/${address}`;
    const wavesUrl = `/addresses/balance/details/${address}`;
    return (
      await Promise.all([
        makeNodeRequest(assetsUrl).then(({ data }) => data),
        makeNodeRequest(wavesUrl).then(({ data }) => ({
          balances: [{ balance: data.regular, assetId: "WAVES" }],
        })),
      ])
    ).reduce<{ assetId: string; balance: number }[]>(
      (acc, { balances }) => [...acc, ...balances],
      []
    );
  },
  nodeKeysRequest: async (
    contract: string,
    keys: string[] | string
  ): Promise<INodeData[]> => {
    const searchKeys = typeof keys === "string" ? [keys] : keys;
    const search = new URLSearchParams(
      searchKeys?.map((s) => ["key", s]) as any
    );
    const keysArray = search.toString();
    const response = await makeNodeRequest(
      `/addresses/data/${contract}?${keysArray}`
    );
    if (response.data) {
      return response.data;
    } else {
      return [];
    }
  },
  nodeMatchRequest: async (
    contract: string,
    match: string
  ): Promise<INodeData[]> => {
    const url = `/addresses/data/${contract}?matches=${match}`;
    const response: { data: INodeData[] } = await makeNodeRequest(url);
    if (response.data) {
      return response.data;
    } else {
      return [];
    }
  },
  transactionInfo: async (txId: string): Promise<ITransaction | null> => {
    const url = `/transactions/info/${txId}`;
    const response: { data: ITransaction } = await makeNodeRequest(url);
    if (response.data) {
      return response.data;
    } else {
      return null;
    }
  },
  transactions: async (
    address: string,
    limit = 10,
    after?: string
  ): Promise<ITransaction[] | null> => {
    const urlSearchParams = new URLSearchParams();
    if (after != null) {
      urlSearchParams.set("after", after);
    }
    const url = `/transactions/address/${address}/limit/${limit}?${
      after != null ? urlSearchParams.toString() : ""
    }`;
    const response: { data: [ITransaction[]] } = await makeNodeRequest(url);
    if (response.data[0]) {
      return response.data[0];
    } else {
      return null;
    }
  },
  assetDetails: async (assetId: string): Promise<IAssetDetails | null> => {
    const url = `/assets/details/${assetId}`;
    const response: { data: IAssetDetails } = await makeNodeRequest(url);
    if (response.data) {
      return response.data;
    } else {
      return null;
    }
  },
};

export interface ITransaction {
  type: number;
  id: string;
  sender: string;
  senderPublicKey: string;
  fee: number;
  feeAssetId: null;
  timestamp: number;
  proofs: string[];
  version: number;
  dApp: string;
  payment: [
    {
      amount: number;
      assetId: null | string;
    }
  ];
  call: {
    function: string;
    args: [
      {
        type: string;
        value: string;
      },
      {
        type: string;
        value: number;
      }
    ];
  };
  height: number;
  applicationStatus: string;
  spentComplexity: number;
  stateChanges: {
    data: [];
    transfers: [
      {
        address: string;
        asset: string;
        amount: number;
      }
    ];
    issues: [];
    reissues: [];
    burns: [];
    sponsorFees: [];
    leases: [];
    leaseCancels: [];
    invokes: [
      {
        dApp: string;
        call: {
          function: string;
          args: [
            {
              type: string;
              value: number;
            }
          ];
        };
        payment: [
          {
            assetId: null;
            amount: number;
          }
        ];
        stateChanges: {
          data: [
            {
              key: string;
              type: string;
              value: number;
            },
            {
              key: string;
              type: string;
              value: number;
            }
          ];
          transfers: [
            {
              address: string;
              asset: string;
              amount: number;
            },
            {
              address: string;
              asset: string;
              amount: number;
            }
          ];
          issues: [];
          reissues: [];
          burns: [];
          sponsorFees: [];
          leases: [];
          leaseCancels: [];
          invokes: [
            {
              dApp: string;
              call: {
                function: string;
                args: [
                  {
                    type: string;
                    value: true;
                  },
                  {
                    type: string;
                    value: number;
                  },
                  {
                    type: string;
                    value: string;
                  }
                ];
              };
              payment: [];
              stateChanges: {
                data: [
                  {
                    key: string;
                    type: string;
                    value: string;
                  },
                  {
                    key: string;
                    type: string;
                    value: number;
                  }
                ];
                transfers: [];
                issues: [];
                reissues: [];
                burns: [];
                sponsorFees: [];
                leases: [
                  {
                    id: string;
                    originTransactionId: string;
                    sender: string;
                    recipient: string;
                    amount: number;
                    height: number;
                    status: string;
                    cancelHeight: number;
                    cancelTransactionId: string;
                  }
                ];
                leaseCancels: [
                  {
                    id: string;
                    originTransactionId: string;
                    sender: string;
                    recipient: string;
                    amount: number;
                    height: number;
                    status: string;
                    cancelHeight: number;
                    cancelTransactionId: string;
                  }
                ];
                invokes: [];
              };
            },
            {
              dApp: string;
              call: {
                function: string;
                args: [
                  {
                    type: string;
                    value: false;
                  },
                  {
                    type: string;
                    value: number;
                  },
                  {
                    type: string;
                    value: string;
                  }
                ];
              };
              payment: [];
              stateChanges: {
                data: [];
                transfers: [];
                issues: [];
                reissues: [];
                burns: [];
                sponsorFees: [];
                leases: [];
                leaseCancels: [];
                invokes: [
                  {
                    dApp: string;
                    call: {
                      function: string;
                      args: [
                        {
                          type: string;
                          value: number;
                        }
                      ];
                    };
                    payment: [];
                    stateChanges: {
                      data: [
                        {
                          key: string;
                          type: string;
                          value: number;
                        },
                        {
                          key: string;
                          type: string;
                          value: number;
                        }
                      ];
                      transfers: [
                        {
                          address: string;
                          asset: string;
                          amount: number;
                        }
                      ];
                      issues: [];
                      reissues: [];
                      burns: [];
                      sponsorFees: [];
                      leases: [];
                      leaseCancels: [];
                      invokes: [];
                    };
                  }
                ];
              };
            }
          ];
        };
      },
      {
        dApp: string;
        call: {
          function: string;
          args: [
            {
              type: string;
              value: string;
            },
            {
              type: string;
              value: number;
            }
          ];
        };
        payment: [
          {
            assetId: string;
            amount: number;
          }
        ];
        stateChanges: {
          data: [
            {
              key: string;
              type: string;
              value: number;
            },
            {
              key: string;
              type: string;
              value: number;
            },
            {
              key: string;
              type: string;
              value: number;
            }
          ];
          transfers: [
            {
              address: string;
              asset: string;
              amount: number;
            }
          ];
          issues: [];
          reissues: [];
          burns: [];
          sponsorFees: [];
          leases: [];
          leaseCancels: [];
          invokes: [
            {
              dApp: string;
              call: {
                function: string;
                args: [];
              };
              payment: [
                {
                  assetId: string;
                  amount: number;
                }
              ];
              stateChanges: {
                data: [
                  {
                    key: string;
                    type: string;
                    value: number;
                  },
                  {
                    key: string;
                    type: string;
                    value: number;
                  },
                  {
                    key: string;
                    type: string;
                    value: number;
                  },
                  {
                    key: string;
                    type: string;
                    value: number;
                  }
                ];
                transfers: [];
                issues: [];
                reissues: [];
                burns: [];
                sponsorFees: [];
                leases: [];
                leaseCancels: [];
                invokes: [];
              };
            }
          ];
        };
      },
      {
        dApp: string;
        call: {
          function: string;
          args: [
            {
              type: string;
              value: number;
            }
          ];
        };
        payment: [
          {
            assetId: string;
            amount: number;
          }
        ];
        stateChanges: {
          data: [
            {
              key: string;
              type: string;
              value: number;
            },
            {
              key: string;
              type: string;
              value: number;
            }
          ];
          transfers: [
            {
              address: string;
              asset: null;
              amount: number;
            },
            {
              address: string;
              asset: null;
              amount: number;
            }
          ];
          issues: [];
          reissues: [];
          burns: [];
          sponsorFees: [];
          leases: [];
          leaseCancels: [];
          invokes: [
            {
              dApp: string;
              call: {
                function: string;
                args: [
                  {
                    type: string;
                    value: false;
                  },
                  {
                    type: string;
                    value: number;
                  },
                  {
                    type: string;
                    value: string;
                  }
                ];
              };
              payment: [];
              stateChanges: {
                data: [
                  {
                    key: string;
                    type: string;
                    value: string;
                  },
                  {
                    key: string;
                    type: string;
                    value: number;
                  }
                ];
                transfers: [];
                issues: [];
                reissues: [];
                burns: [];
                sponsorFees: [];
                leases: [
                  {
                    id: string;
                    originTransactionId: string;
                    sender: string;
                    recipient: string;
                    amount: number;
                    height: number;
                    status: string;
                    cancelHeight: number;
                    cancelTransactionId: string;
                  }
                ];
                leaseCancels: [
                  {
                    id: string;
                    originTransactionId: string;
                    sender: string;
                    recipient: string;
                    amount: number;
                    height: number;
                    status: string;
                    cancelHeight: number;
                    cancelTransactionId: string;
                  }
                ];
                invokes: [];
              };
            }
          ];
        };
      }
    ];
  };
}

export interface IEvaluateScript {
  result: {
    type: string;
    value: Record<
      string,
      {
        type: string;
        value: string | number | boolean | [];
      }
    >;
  };
  complexity: number;
  expr: string;
  address: string;
}

export default nodeService;
