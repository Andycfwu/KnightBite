import { DailyMenu, DiningHall, DiningHallId, MealSection, MealType, MenuItem, Nutrition, Station } from "@/lib/types";

const today = new Date();
const todayIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

type ItemInput = {
  name: string;
  servingSize: string;
  nutrition: Nutrition;
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
};

function createMenuItem(
  hallId: DiningHallId,
  mealType: MealType,
  stationId: string,
  stationName: string,
  input: ItemInput
): MenuItem {
  return {
    id: `${hallId}-${mealType}-${stationId}-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: input.name,
    stationId,
    stationName,
    hallId,
    mealType,
    servingSize: input.servingSize,
    nutrition: input.nutrition,
    ingredients: input.ingredients,
    allergens: input.allergens,
    tags: input.tags,
    imageUrl: null,
    available: true
  };
}

function createStation(
  hallId: DiningHallId,
  mealType: MealType,
  stationId: string,
  name: string,
  items: ItemInput[]
): Station {
  return {
    id: stationId,
    name,
    items: items.map((item) => createMenuItem(hallId, mealType, stationId, name, item))
  };
}

function createMeal(
  hallId: DiningHallId,
  type: MealType,
  label: string,
  stations: Array<{ id: string; name: string; items: ItemInput[] }>
): MealSection {
  return {
    id: `${hallId}-${type}`,
    type,
    label,
    stations: stations.map((station) => createStation(hallId, type, station.id, station.name, station.items))
  };
}

export const diningHalls: DiningHall[] = [
  { id: "livingston", name: "Livingston Dining Commons", shortName: "Livingston" },
  { id: "busch", name: "Busch Dining Hall", shortName: "Busch" },
  { id: "neilson", name: "Neilson Dining Hall", shortName: "Cook/Douglass" },
  { id: "atrium", name: "The Atrium", shortName: "College Avenue" }
];

export const dailyMenus: DailyMenu[] = [
  {
    date: todayIso,
    hallId: "livingston",
    hallName: "Livingston Dining Commons",
    meals: [
      createMeal("livingston", "breakfast", "Breakfast", [
        {
          id: "grill",
          name: "Grill",
          items: [
            { name: "Made-to-Order Omelet", servingSize: "1 omelet", nutrition: { calories: 240, protein: 18, carbs: 4, fat: 16, sodium: 420 }, tags: ["high-protein"] },
            { name: "Turkey Sausage Links", servingSize: "3 links", nutrition: { calories: 170, protein: 12, carbs: 2, fat: 13, sodium: 430 }, tags: ["high-protein"] },
            { name: "Home Fries", servingSize: "4 oz", nutrition: { calories: 180, protein: 3, carbs: 27, fat: 7, sodium: 210 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "bakery",
          name: "Bakery",
          items: [
            { name: "Blueberry Pancakes", servingSize: "3 pancakes", nutrition: { calories: 310, protein: 8, carbs: 54, fat: 7, sodium: 390, sugar: 14 }, tags: ["vegetarian"] },
            { name: "Greek Yogurt Parfait", servingSize: "8 oz", nutrition: { calories: 240, protein: 14, carbs: 32, fat: 6, sodium: 95, sugar: 18 }, tags: ["vegetarian"] },
            { name: "Banana Nut Muffin", servingSize: "1 muffin", nutrition: { calories: 330, protein: 5, carbs: 44, fat: 14, sodium: 280, sugar: 19 }, tags: ["vegetarian"] }
          ]
        }
      ]),
      createMeal("livingston", "lunch", "Lunch", [
        {
          id: "global-kitchen",
          name: "Global Kitchen",
          items: [
            { name: "Chicken Tikka Masala", servingSize: "5 oz", nutrition: { calories: 310, protein: 27, carbs: 14, fat: 16, sodium: 610 }, tags: ["high-protein"] },
            { name: "Basmati Rice", servingSize: "4 oz", nutrition: { calories: 160, protein: 3, carbs: 34, fat: 1, sodium: 10 }, tags: ["vegan"] },
            { name: "Tofu Stir Fry", servingSize: "1 bowl", nutrition: { calories: 280, protein: 16, carbs: 18, fat: 15, sodium: 540 }, tags: ["vegan", "vegetarian"] }
          ]
        },
        {
          id: "greens",
          name: "Greens",
          items: [
            { name: "Kale Caesar Salad", servingSize: "1 bowl", nutrition: { calories: 190, protein: 6, carbs: 11, fat: 14, sodium: 360 }, tags: ["vegetarian"] },
            { name: "Roasted Vegetable Soup", servingSize: "8 oz", nutrition: { calories: 120, protein: 4, carbs: 19, fat: 3, sodium: 480 }, tags: ["vegan"] },
            { name: "Quinoa Chickpea Bowl", servingSize: "1 bowl", nutrition: { calories: 340, protein: 12, carbs: 49, fat: 10, sodium: 390 }, tags: ["vegan"] }
          ]
        }
      ]),
      createMeal("livingston", "dinner", "Dinner", [
        {
          id: "hearth",
          name: "Hearth",
          items: [
            { name: "Herb Roasted Salmon", servingSize: "5 oz", nutrition: { calories: 290, protein: 32, carbs: 2, fat: 17, sodium: 320 }, tags: ["high-protein"] },
            { name: "Garlic Rice Pilaf", servingSize: "4 oz", nutrition: { calories: 190, protein: 4, carbs: 31, fat: 5, sodium: 180 }, tags: ["vegetarian"] },
            { name: "Roasted Broccoli", servingSize: "4 oz", nutrition: { calories: 80, protein: 4, carbs: 9, fat: 4, sodium: 120 }, tags: ["vegan"] }
          ]
        },
        {
          id: "comfort",
          name: "Comfort",
          items: [
            { name: "Penne Alfredo", servingSize: "6 oz", nutrition: { calories: 370, protein: 11, carbs: 38, fat: 19, sodium: 520 }, tags: ["vegetarian"] },
            { name: "Grilled Chicken Breast", servingSize: "4 oz", nutrition: { calories: 190, protein: 35, carbs: 1, fat: 4, sodium: 280 }, tags: ["high-protein"] },
            { name: "Steamed Green Beans", servingSize: "4 oz", nutrition: { calories: 45, protein: 2, carbs: 8, fat: 1, sodium: 85 }, tags: ["vegan"] }
          ]
        }
      ])
    ]
  },
  {
    date: todayIso,
    hallId: "busch",
    hallName: "Busch Dining Hall",
    meals: [
      createMeal("busch", "breakfast", "Breakfast", [
        {
          id: "classics",
          name: "Classics",
          items: [
            { name: "Scrambled Eggs", servingSize: "4 oz", nutrition: { calories: 140, protein: 10, carbs: 2, fat: 10, sodium: 170 }, tags: ["vegetarian", "high-protein"] },
            { name: "Buttermilk Pancakes", servingSize: "3 pancakes", nutrition: { calories: 290, protein: 8, carbs: 50, fat: 6, sodium: 420, sugar: 10 }, tags: ["vegetarian"] },
            { name: "Crispy Hash Browns", servingSize: "4 oz", nutrition: { calories: 170, protein: 2, carbs: 20, fat: 9, sodium: 260 }, tags: ["vegan"] }
          ]
        },
        {
          id: "market",
          name: "Morning Market",
          items: [
            { name: "Brown Sugar Oatmeal", servingSize: "8 oz", nutrition: { calories: 190, protein: 6, carbs: 33, fat: 4, sodium: 140, sugar: 9 }, tags: ["vegetarian"] },
            { name: "Yogurt Parfait Cup", servingSize: "7 oz", nutrition: { calories: 210, protein: 12, carbs: 29, fat: 5, sodium: 90, sugar: 15 }, tags: ["vegetarian"] },
            { name: "Fresh Fruit Salad", servingSize: "6 oz", nutrition: { calories: 75, protein: 1, carbs: 19, fat: 0, sodium: 5, sugar: 15 }, tags: ["vegan"] }
          ]
        }
      ]),
      createMeal("busch", "lunch", "Lunch", [
        {
          id: "comfort",
          name: "Comfort",
          items: [
            { name: "Burger", servingSize: "1 burger", nutrition: { calories: 470, protein: 27, carbs: 30, fat: 26, sodium: 720 }, tags: ["high-protein"] },
            { name: "Seasoned Fries", servingSize: "5 oz", nutrition: { calories: 320, protein: 4, carbs: 39, fat: 17, sodium: 360 }, tags: ["vegan"] },
            { name: "Tomato Basil Soup", servingSize: "8 oz", nutrition: { calories: 150, protein: 4, carbs: 23, fat: 4, sodium: 540 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "fresh",
          name: "Fresh Picks",
          items: [
            { name: "Southwest Chicken Salad", servingSize: "1 bowl", nutrition: { calories: 300, protein: 25, carbs: 15, fat: 15, sodium: 510 }, tags: ["high-protein"] },
            { name: "Roasted Vegetable Pasta", servingSize: "6 oz", nutrition: { calories: 330, protein: 10, carbs: 48, fat: 11, sodium: 390 }, tags: ["vegetarian"] },
            { name: "Hummus Snack Box", servingSize: "1 box", nutrition: { calories: 220, protein: 7, carbs: 24, fat: 10, sodium: 270 }, tags: ["vegetarian"] }
          ]
        }
      ]),
      createMeal("busch", "dinner", "Dinner", [
        {
          id: "chef-table",
          name: "Chef Table",
          items: [
            { name: "Beef Stir Fry", servingSize: "1 bowl", nutrition: { calories: 360, protein: 28, carbs: 19, fat: 18, sodium: 740 }, tags: ["high-protein"] },
            { name: "Tofu Fried Rice", servingSize: "1 bowl", nutrition: { calories: 330, protein: 12, carbs: 41, fat: 13, sodium: 590 }, tags: ["vegan"] },
            { name: "Miso Vegetable Soup", servingSize: "8 oz", nutrition: { calories: 90, protein: 4, carbs: 13, fat: 2, sodium: 610 }, tags: ["vegan"] }
          ]
        },
        {
          id: "carvery",
          name: "Carvery",
          items: [
            { name: "Roasted Turkey", servingSize: "4 oz", nutrition: { calories: 210, protein: 31, carbs: 1, fat: 8, sodium: 390 }, tags: ["high-protein"] },
            { name: "Mashed Potatoes", servingSize: "4 oz", nutrition: { calories: 150, protein: 3, carbs: 24, fat: 5, sodium: 180 }, tags: ["vegetarian"] },
            { name: "Roasted Carrots", servingSize: "4 oz", nutrition: { calories: 70, protein: 1, carbs: 13, fat: 2, sodium: 95 }, tags: ["vegan"] }
          ]
        }
      ])
    ]
  },
  {
    date: todayIso,
    hallId: "neilson",
    hallName: "Neilson Dining Hall",
    meals: [
      createMeal("neilson", "breakfast", "Breakfast", [
        {
          id: "farmhouse",
          name: "Farmhouse",
          items: [
            { name: "Egg White Bites", servingSize: "2 pieces", nutrition: { calories: 170, protein: 15, carbs: 6, fat: 9, sodium: 330 }, tags: ["high-protein"] },
            { name: "Steel Cut Oats", servingSize: "8 oz", nutrition: { calories: 180, protein: 5, carbs: 30, fat: 4, sodium: 110, sugar: 6 }, tags: ["vegetarian"] },
            { name: "Berry Yogurt Bowl", servingSize: "1 bowl", nutrition: { calories: 220, protein: 13, carbs: 31, fat: 5, sodium: 95, sugar: 17 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "bakery",
          name: "Bakery",
          items: [
            { name: "Whole Grain Waffles", servingSize: "2 waffles", nutrition: { calories: 250, protein: 8, carbs: 38, fat: 7, sodium: 320, sugar: 8 }, tags: ["vegetarian"] },
            { name: "Turkey Bacon", servingSize: "3 slices", nutrition: { calories: 110, protein: 9, carbs: 1, fat: 7, sodium: 370 }, tags: ["high-protein"] },
            { name: "Fresh Fruit Cup", servingSize: "6 oz", nutrition: { calories: 70, protein: 1, carbs: 18, fat: 0, sodium: 5, sugar: 14 }, tags: ["vegan"] }
          ]
        }
      ]),
      createMeal("neilson", "lunch", "Lunch", [
        {
          id: "garden",
          name: "Garden",
          items: [
            { name: "Roasted Veggie Quinoa Bowl", servingSize: "1 bowl", nutrition: { calories: 340, protein: 12, carbs: 49, fat: 11, sodium: 410 }, tags: ["vegan"] },
            { name: "Spinach Lentil Soup", servingSize: "8 oz", nutrition: { calories: 140, protein: 8, carbs: 22, fat: 2, sodium: 460 }, tags: ["vegan"] },
            { name: "Chopped Greek Salad", servingSize: "1 bowl", nutrition: { calories: 210, protein: 6, carbs: 12, fat: 15, sodium: 420 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "rotisserie",
          name: "Rotisserie",
          items: [
            { name: "Lemon Pepper Chicken", servingSize: "4 oz", nutrition: { calories: 230, protein: 29, carbs: 3, fat: 11, sodium: 390 }, tags: ["high-protein"] },
            { name: "Brown Rice", servingSize: "4 oz", nutrition: { calories: 170, protein: 4, carbs: 35, fat: 1, sodium: 15 }, tags: ["vegan"] },
            { name: "Roasted Brussels Sprouts", servingSize: "4 oz", nutrition: { calories: 85, protein: 4, carbs: 12, fat: 3, sodium: 110 }, tags: ["vegan"] }
          ]
        }
      ]),
      createMeal("neilson", "dinner", "Dinner", [
        {
          id: "homestyle",
          name: "Homestyle",
          items: [
            { name: "Turkey Meatloaf", servingSize: "5 oz", nutrition: { calories: 280, protein: 24, carbs: 17, fat: 12, sodium: 640 }, tags: ["high-protein"] },
            { name: "Garlic Green Beans", servingSize: "4 oz", nutrition: { calories: 60, protein: 2, carbs: 8, fat: 2, sodium: 150 }, tags: ["vegan"] },
            { name: "Roasted Sweet Potatoes", servingSize: "4 oz", nutrition: { calories: 130, protein: 2, carbs: 26, fat: 3, sodium: 80 }, tags: ["vegan"] }
          ]
        },
        {
          id: "hearth",
          name: "Hearth",
          items: [
            { name: "Pesto Pasta", servingSize: "6 oz", nutrition: { calories: 390, protein: 10, carbs: 44, fat: 19, sodium: 480 }, tags: ["vegetarian"] },
            { name: "Baked Cod", servingSize: "5 oz", nutrition: { calories: 220, protein: 31, carbs: 2, fat: 9, sodium: 330 }, tags: ["high-protein"] },
            { name: "Minestrone Soup", servingSize: "8 oz", nutrition: { calories: 130, protein: 5, carbs: 21, fat: 3, sodium: 520 }, tags: ["vegan"] }
          ]
        }
      ])
    ]
  },
  {
    date: todayIso,
    hallId: "atrium",
    hallName: "The Atrium",
    meals: [
      createMeal("atrium", "breakfast", "Breakfast", [
        {
          id: "grab-and-go",
          name: "Grab & Go",
          items: [
            { name: "Protein Breakfast Box", servingSize: "1 box", nutrition: { calories: 280, protein: 17, carbs: 24, fat: 13, sodium: 430 }, tags: ["high-protein"] },
            { name: "Berry Smoothie", servingSize: "12 oz", nutrition: { calories: 210, protein: 10, carbs: 33, fat: 4, sodium: 120, sugar: 24 }, tags: ["vegetarian"] },
            { name: "Overnight Oats", servingSize: "1 jar", nutrition: { calories: 260, protein: 9, carbs: 39, fat: 8, sodium: 150, sugar: 11 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "griddle",
          name: "Griddle",
          items: [
            { name: "Breakfast Sandwich", servingSize: "1 sandwich", nutrition: { calories: 410, protein: 21, carbs: 31, fat: 22, sodium: 760 }, tags: ["high-protein"] },
            { name: "French Toast Sticks", servingSize: "5 pieces", nutrition: { calories: 300, protein: 7, carbs: 46, fat: 9, sodium: 360, sugar: 12 }, tags: ["vegetarian"] },
            { name: "Turkey Sausage Patty", servingSize: "1 patty", nutrition: { calories: 120, protein: 10, carbs: 1, fat: 8, sodium: 290 }, tags: ["high-protein"] }
          ]
        }
      ]),
      createMeal("atrium", "lunch", "Lunch", [
        {
          id: "grain-bar",
          name: "Grain Bar",
          items: [
            { name: "Chicken Burrito Bowl", servingSize: "1 bowl", nutrition: { calories: 520, protein: 31, carbs: 48, fat: 21, sodium: 860 }, tags: ["high-protein"] },
            { name: "Seasoned Black Beans", servingSize: "4 oz", nutrition: { calories: 130, protein: 8, carbs: 22, fat: 1, sodium: 220 }, tags: ["vegan"] },
            { name: "Cilantro Lime Rice", servingSize: "4 oz", nutrition: { calories: 180, protein: 3, carbs: 35, fat: 3, sodium: 160 }, tags: ["vegan"] }
          ]
        },
        {
          id: "street-grill",
          name: "Street Grill",
          items: [
            { name: "Turkey Burger", servingSize: "1 burger", nutrition: { calories: 410, protein: 29, carbs: 31, fat: 19, sodium: 690 }, tags: ["high-protein"] },
            { name: "Veggie Burger", servingSize: "1 burger", nutrition: { calories: 360, protein: 17, carbs: 38, fat: 14, sodium: 540 }, tags: ["vegetarian"] },
            { name: "Baked Fries", servingSize: "4 oz", nutrition: { calories: 210, protein: 3, carbs: 29, fat: 9, sodium: 250 }, tags: ["vegan"] }
          ]
        }
      ]),
      createMeal("atrium", "dinner", "Dinner", [
        {
          id: "late-bites",
          name: "Late Bites",
          items: [
            { name: "Chicken Alfredo Pasta", servingSize: "1 bowl", nutrition: { calories: 470, protein: 24, carbs: 39, fat: 23, sodium: 640 }, tags: ["high-protein"] },
            { name: "Margherita Flatbread", servingSize: "1 flatbread", nutrition: { calories: 420, protein: 15, carbs: 47, fat: 18, sodium: 580 }, tags: ["vegetarian"] },
            { name: "Tomato Soup", servingSize: "8 oz", nutrition: { calories: 140, protein: 4, carbs: 20, fat: 4, sodium: 520 }, tags: ["vegetarian"] }
          ]
        },
        {
          id: "bowls",
          name: "Bowls",
          items: [
            { name: "Teriyaki Tofu Bowl", servingSize: "1 bowl", nutrition: { calories: 360, protein: 16, carbs: 42, fat: 13, sodium: 670 }, tags: ["vegan"] },
            { name: "Sesame Broccoli", servingSize: "4 oz", nutrition: { calories: 90, protein: 4, carbs: 10, fat: 4, sodium: 160 }, tags: ["vegan"] },
            { name: "Brown Rice Noodles", servingSize: "4 oz", nutrition: { calories: 190, protein: 3, carbs: 39, fat: 2, sodium: 45 }, tags: ["vegan"] }
          ]
        }
      ])
    ]
  }
];
