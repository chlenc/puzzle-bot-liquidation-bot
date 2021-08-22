export interface IDuck {
  id: string;
  name?: string;
  real_name?: string;
  price?: number;
  rarity?: number;
  farming_power?: number;
  bid?: number;
}

export const IDucksSchema = {
  type: [
    {
      id: { type: String, required: true },
      name: { type: String, required: false },
      real_name: { type: String, required: false },
      price: { type: Number, required: false },
      rarity: { type: Number, required: false },
      farming_power: { type: Number, required: false },
      bid: { type: Number, required: false },
    },
  ],
  required: true,
};
