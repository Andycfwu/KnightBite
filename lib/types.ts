export type DiningHallId = "busch" | "livingston" | "neilson" | "atrium";

export type MealType = "breakfast" | "lunch" | "dinner";

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  sugar?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  stationId: string;
  stationName: string;
  hallId: DiningHallId;
  mealType: MealType;
  servingSize?: string;
  nutrition: Nutrition;
  description?: string;
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
  imageUrl?: string | null;
  isCustom?: boolean;
  available: boolean;
};

export type Station = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type MealSection = {
  id: string;
  type: MealType;
  label: string;
  stations: Station[];
};

export type DailyMenu = {
  date: string;
  hallId: DiningHallId;
  hallName: string;
  meals: MealSection[];
  isLiveData?: boolean;
  lastUpdatedAt?: string;
};

export type DiningHall = {
  id: DiningHallId;
  name: string;
  shortName: string;
};

export type PlateItem = {
  itemId: string;
  name: string;
  quantity: number;
  servingSize?: string;
  nutrition: Nutrition;
};

export type Plate = {
  items: PlateItem[];
};
