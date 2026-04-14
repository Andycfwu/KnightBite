import { ClassValue, clsx } from "clsx";

export const RUTGERS_TIME_ZONE = "America/New_York";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: RUTGERS_TIME_ZONE
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatShortDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: RUTGERS_TIME_ZONE
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatUpdatedTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: RUTGERS_TIME_ZONE
  }).format(new Date(date));
}

export function getTodayIsoDate() {
  return getRutgersNowParts().isoDate;
}

export function slugToTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getGreetingForHour() {
  const hour = getRutgersNowParts().hour;

  if (hour < 12) {
    return "Good Morning,";
  }

  if (hour < 18) {
    return "Good Afternoon,";
  }

  return "Good Evening,";
}

export function getRutgersNowParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: RUTGERS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  return {
    year,
    month,
    day,
    hour,
    minute,
    isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  };
}

export function getRutgersCurrentDecimalHour() {
  const { hour, minute } = getRutgersNowParts();
  return hour + minute / 60;
}

export function formatRutgersServiceTime(value: number) {
  const hours = Math.floor(value);
  const minutes = value % 1 === 0 ? 0 : 30;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes, 0)));
}
