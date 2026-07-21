const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const MIN_TIMEZONE_OFFSET_MINUTES = -720;
export const MAX_TIMEZONE_OFFSET_MINUTES = 840;

export interface AnalyticsRange {
  days: number;
  timezoneOffsetMinutes: number;
  start: string;
  end: string;
  dates: string[];
}

export interface DailyAnalyticsPoint {
  date: string;
  clicks: number;
  humanClicks: number;
  botClicks: number;
  uniqueVisitors: number;
}

export function parseTimezoneOffset(value?: string): number {
  if (!value || !/^-?\d+$/.test(value)) return 0;
  return normalizeTimezoneOffset(Number(value));
}

export function createAnalyticsRange(
  requestedDays: number,
  requestedOffset: number,
  now = new Date()
): AnalyticsRange {
  const safeDays = Number.isFinite(requestedDays) ? Math.trunc(requestedDays) : 30;
  const days = Math.max(1, Math.min(safeDays, 365));
  const timezoneOffsetMinutes = normalizeTimezoneOffset(requestedOffset);
  const localNow = new Date(now.getTime() + timezoneOffsetMinutes * MINUTE_MS);
  const localToday = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate()
  );
  const startMs = localToday - (days - 1) * DAY_MS - timezoneOffsetMinutes * MINUTE_MS;
  const endMs = localToday + DAY_MS - timezoneOffsetMinutes * MINUTE_MS;
  const dates = Array.from({ length: days }, (_, index) =>
    new Date(localToday - (days - 1 - index) * DAY_MS).toISOString().slice(0, 10)
  );

  return {
    days,
    timezoneOffsetMinutes,
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    dates,
  };
}

export function createPreviousAnalyticsRange(range: AnalyticsRange): AnalyticsRange {
  const periodMs = range.days * DAY_MS;
  return {
    ...range,
    start: new Date(Date.parse(range.start) - periodMs).toISOString(),
    end: range.start,
    dates: range.dates.map((date) =>
      new Date(Date.parse(`${date}T00:00:00.000Z`) - periodMs).toISOString().slice(0, 10)
    ),
  };
}

export function localDateSql(column: string, offsetMinutes: number): string {
  const offset = normalizeTimezoneOffset(offsetMinutes);
  if (offset === 0) return `substr(${column}, 1, 10)`;
  const modifier = `${offset > 0 ? '+' : ''}${offset} minutes`;
  return `date(${column}, '${modifier}')`;
}

export function localHourSql(column: string, offsetMinutes: number): string {
  return localPartSql(column, '%H', offsetMinutes);
}

export function localWeekdaySql(column: string, offsetMinutes: number): string {
  return localPartSql(column, '%w', offsetMinutes);
}

export function fillDailyAnalytics(
  rows: DailyAnalyticsPoint[],
  range: AnalyticsRange
): DailyAnalyticsPoint[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return range.dates.map((date) => {
    const row = byDate.get(date);
    return {
      date,
      clicks: Number(row?.clicks ?? 0),
      humanClicks: Number(row?.humanClicks ?? 0),
      botClicks: Number(row?.botClicks ?? 0),
      uniqueVisitors: Number(row?.uniqueVisitors ?? 0),
    };
  });
}

function normalizeTimezoneOffset(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < MIN_TIMEZONE_OFFSET_MINUTES ||
    value > MAX_TIMEZONE_OFFSET_MINUTES
  ) {
    return 0;
  }
  return value;
}

function localPartSql(column: string, format: '%H' | '%w', offsetMinutes: number): string {
  const offset = normalizeTimezoneOffset(offsetMinutes);
  if (offset === 0) return `CAST(strftime('${format}', ${column}) AS INTEGER)`;
  const modifier = `${offset > 0 ? '+' : ''}${offset} minutes`;
  return `CAST(strftime('${format}', ${column}, '${modifier}') AS INTEGER)`;
}
