export interface DailySummaryReport {
  id: number;
  shiftId: number;
  userId: number;
  endDate: string;
  fuelSales: number;
  itemSales: number;
  gst: number;
  hst: number;
  pennyRounding: number;
  totalSales: number;
}

export interface DailySummaryReportRow {
  id: number;
  shift_id: number;
  user_id: number;
  end_date: Date;
  fuel_sales: number;
  item_sales: number;
  gst: number;
  hst: number;
  penny_rounding: number;
  total_sales: number;
}
