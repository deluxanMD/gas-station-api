export interface Fuel {
  id: number;
  shiftId: number;
  userId: number;
  biodieselVolume: number;
  biodieselTotal: number;
  reg87Volume: number;
  reg87Total: number;
  extra89Volume: number;
  extra89Total: number;
  supr91Volume: number;
  supr91Total: number;
  plus93Volume: number;
  plus93Total: number;
  totalVolume: number;
}

export interface FuelRow {
  id: number;
  shift_id: number;
  user_id: number;
  volume_biodiesel: number;
  total_biodiesel: number;
  volume_reg_87: number;
  total_reg_87: number;
  volume_extra_89: number;
  total_extra_89: number;
  volume_supr_91: number;
  total_supr_91: number;
  volume_plus_93: number;
  total_plus_93: number;
  total_volume: number;
}
