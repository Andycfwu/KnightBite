import { ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

export function formatShortDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

export function formatUpdatedTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

export function getTodayIsoDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function slugToTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getGreetingForHour(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good Morning,";
  }

  if (hour < 18) {
    return "Good Afternoon,";
  }

  return "Good Evening,";
}
