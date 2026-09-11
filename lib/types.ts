export type DiningHallId = "busch" | "livingston" | "neilson" | "atrium";

export type MealType = "breakfast" | "lunch" | "dinner";

export type Nutrition = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sodium?: number | null;
  sugar?: number | null;
};

export type PlateTotals = Nutrition & {
  coverage: Record<keyof Nutrition, { known: number; missing: number }>;
};

export type MenuItem = {
  id: string;
  name: string;
  stationId: string;
  stationName: string;
  hallId: DiningHallId;
  mealType: MealType;
  menuDate?: string;
  servingSize?: string;
  nutrition: Nutrition;
  description?: string;
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
  sourceLabels?: string[];
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

export type MealStatus = {
  state: "available" | "empty" | "unavailable";
  retrievedAt?: string;
  retryAt?: number;
};

export type MealLoadResult = {
  hallId: DiningHallId;
  date: string;
  mealType: MealType;
  section: MealSection | null;
  status: MealStatus;
};

export type DailyMenu = {
  date: string;
  hallId: DiningHallId;
  hallName: string;
  meals: MealSection[];
  mealStatus?: Partial<Record<MealType, MealStatus>>;
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
  sourceItemId?: string;
  menuDate?: string;
  isCustom?: boolean;
  name: string;
  quantity: number;
  servingSize?: string;
  nutrition: Nutrition;
};

export type Plate = {
  items: PlateItem[];
};
