import { DiningHallId, MealType } from "@/lib/types";

export const APP_NAME = "KnightBite";
export const APP_SUBTITLE = "Rutgers dining, simplified.";
export const TODAY_MENU_LABEL = "Today’s menu";
export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner"
};
export const HALL_BLURBS: Record<DiningHallId, string> = {
  livingston: "Big stations, reliable variety, and easy mix-and-match plates.",
  busch: "Comfort classics, grill favorites, and balanced lunch staples.",
  neilson: "Fresh sides, rotating mains, and lighter Cook/Douglass options.",
  atrium: "Fast bowls, grill picks, and quick College Avenue stop-ins."
};

export const HALL_LOCATIONS: Record<DiningHallId, string> = {
  livingston: "Livingston",
  busch: "Busch",
  neilson: "Cook/Douglass",
  atrium: "College Avenue"
};
