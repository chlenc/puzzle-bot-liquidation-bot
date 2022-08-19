
export type TDataEntry = { key: string; type: string; value: string };

export interface INodeResponse<T = TDataEntry[]> {
  data: T;
}
