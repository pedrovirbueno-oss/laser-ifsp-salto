import { OeeMetrics, ProductionRecord, DowntimeRecord, Product, Shift } from '@/types';

/**
 * Calculates OEE (Overall Equipment Effectiveness) for a machine or company dataset.
 * Formulas:
 *  - Availability = Run Time / Planned Operational Time
 *  - Performance  = Real Production Output / Theoretical Production Output
 *  - Quality      = Good Units (Total - Scrap) / Total Units Produced
 *  - OEE          = Availability * Performance * Quality
 * 
 * Rules:
 *  - No arbitrary fallbacks (e.g. no fake 60 units/hr).
 *  - Returns `sufficientData: false` if planned time <= 0, no production records, or missing target rates.
 *  - Clamped strictly between 0% and 100%.
 */
export function calculateOee(
  productionRecords: ProductionRecord[],
  downtimeRecords: DowntimeRecord[],
  plannedTimeMinutes: number,
  targetProductsMap?: Record<string, Product>
): OeeMetrics {
  if (plannedTimeMinutes <= 0 || productionRecords.length === 0) {
    return {
      availability: 0,
      performance: 0,
      quality: 0,
      oee: 0,
      plannedTimeMinutes,
      downtimeMinutes: 0,
      runTimeMinutes: 0,
      totalCount: 0,
      scrapCount: 0,
      goodCount: 0,
      timeWindow: 'Período Selecionado',
      sufficientData: false,
    };
  }

  // Total Downtime in Minutes
  const totalDowntimeSeconds = downtimeRecords.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const downtimeMinutes = totalDowntimeSeconds / 60;

  // Run Time = Planned Time - Downtime (Cannot be negative)
  const runTimeMinutes = Math.max(0, plannedTimeMinutes - downtimeMinutes);

  // Availability = Run Time / Planned Time
  const rawAvailability = plannedTimeMinutes > 0 ? (runTimeMinutes / plannedTimeMinutes) : 0;

  // Production Totals & Theoretical Output
  let totalCount = 0;
  let scrapCount = 0;
  let theoreticalExpectedOutput = 0;
  let hasValidTargetData = false;

  for (const record of productionRecords) {
    const total = record.produced_quantity || 0;
    const scrap = record.rejected_quantity || 0;
    totalCount += total;
    scrapCount += scrap;

    // Calculate theoretical expected output ONLY if valid product target rates exist
    if (targetProductsMap && record.product_id && targetProductsMap[record.product_id]) {
      const product = targetProductsMap[record.product_id];
      
      let targetPerHour = product.target_quantity_per_hour;
      if (!targetPerHour && product.target_cycle_time_seconds && product.target_cycle_time_seconds > 0) {
        targetPerHour = 3600 / product.target_cycle_time_seconds;
      }

      if (targetPerHour && targetPerHour > 0) {
        hasValidTargetData = true;
        let durationHours = 0;
        if (record.start_time && record.end_time) {
          const start = new Date(record.start_time).getTime();
          const end = new Date(record.end_time).getTime();
          durationHours = Math.max(0, (end - start) / (1000 * 3600));
        } else {
          durationHours = (runTimeMinutes / 60) / Math.max(1, productionRecords.length);
        }
        theoreticalExpectedOutput += targetPerHour * durationHours;
      }
    }
  }

  const goodCount = Math.max(0, totalCount - scrapCount);

  // Quality = Good Count / Total Count
  const rawQuality = totalCount > 0 ? (goodCount / totalCount) : 0;

  // Performance calculation: require valid target data, no arbitrary 60 pçs/h fallback
  let rawPerformance = 0;
  if (hasValidTargetData && theoreticalExpectedOutput > 0) {
    rawPerformance = totalCount / theoreticalExpectedOutput;
  } else {
    // Insufficient target data to compute valid performance
    return {
      availability: Number((Math.min(100, Math.max(0, rawAvailability * 100))).toFixed(1)),
      performance: 0,
      quality: Number((Math.min(100, Math.max(0, rawQuality * 100))).toFixed(1)),
      oee: 0,
      plannedTimeMinutes: Math.round(plannedTimeMinutes),
      downtimeMinutes: Math.round(downtimeMinutes),
      runTimeMinutes: Math.round(runTimeMinutes),
      totalCount,
      scrapCount,
      goodCount,
      timeWindow: 'Período Selecionado',
      sufficientData: false,
    };
  }

  // Clamp Availability, Performance, Quality strictly between 0% and 100%
  const availabilityPct = Math.min(100, Math.max(0, rawAvailability * 100));
  const performancePct  = Math.min(100, Math.max(0, rawPerformance * 100));
  const qualityPct      = Math.min(100, Math.max(0, rawQuality * 100));

  // OEE = (Availability/100) * (Performance/100) * (Quality/100) * 100
  const oeePct = (availabilityPct / 100) * (performancePct / 100) * (qualityPct / 100) * 100;

  return {
    availability: Number(availabilityPct.toFixed(1)),
    performance: Number(performancePct.toFixed(1)),
    quality: Number(qualityPct.toFixed(1)),
    oee: Number(oeePct.toFixed(1)),
    plannedTimeMinutes: Math.round(plannedTimeMinutes),
    downtimeMinutes: Math.round(downtimeMinutes),
    runTimeMinutes: Math.round(runTimeMinutes),
    totalCount,
    scrapCount,
    goodCount,
    timeWindow: 'Período Selecionado',
    sufficientData: true,
  };
}

/**
 * Utility to compute total planned operational minutes for a given machine & period.
 * Accurately calculates shift duration including overnight shifts (e.g. 22:00 to 06:00).
 */
export function calculatePlannedTimeMinutes(
  startDate: Date,
  endDate: Date,
  shifts?: Shift[] | number
): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (typeof shifts === 'number') {
    return diffDays * shifts * 60;
  }

  if (shifts && shifts.length > 0) {
    let dailyPlannedMinutes = 0;
    for (const s of shifts) {
      if (!s.active) continue;
      const [startH, startM] = s.start_time.split(':').map(Number);
      const [endH, endM]     = s.end_time.split(':').map(Number);

      let startTotal = startH * 60 + (startM || 0);
      let endTotal   = endH * 60 + (endM || 0);

      // Handle overnight shift (e.g. 22:00 to 06:00)
      if (endTotal <= startTotal) {
        endTotal += 24 * 60;
      }
      dailyPlannedMinutes += (endTotal - startTotal);
    }
    return diffDays * dailyPlannedMinutes;
  }

  // Fallback: 2 standard 8-hour shifts = 16 hours/day
  return diffDays * 16 * 60;
}

