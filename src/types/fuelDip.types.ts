export interface FuelDip {
  id: number;
  shiftId: number;
  userId: number;
  // YYYY-MM-DD
  dipDate: string;
  // HH:mm, 24-hour
  dipTime: string;
  regularTcVolume: number;
  regularUllage90: number;
  premiumTcVolume: number;
  premiumUllage90: number;
  dieselTcVolume: number;
  dieselUllage90: number;
}

export interface FuelDipRow {
  id: number;
  shift_id: number;
  user_id: number;
  dip_date: string;
  dip_time: string;
  tc_volume_regular: number;
  ullage_90_regular: number;
  tc_volume_premium: number;
  ullage_90_premium: number;
  tc_volume_diesel: number;
  ullage_90_diesel: number;
}
