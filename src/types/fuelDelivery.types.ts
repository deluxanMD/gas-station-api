export interface FuelDelivery {
  id: number;
  shiftId: number;
  userId: number;
  // YYYY-MM-DD
  deliveryDate: string;
  bolNumber: string;
  reg: number;
  prem: number;
  diesel: number;
  total: number;
}

export interface FuelDeliveryRow {
  id: number;
  shift_id: number;
  user_id: number;
  delivery_date: string;
  bol_number: string;
  reg: number;
  prem: number;
  diesel: number;
  total: number;
}
