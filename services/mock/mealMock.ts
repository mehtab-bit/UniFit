import { IMealService } from '../types';
import { MealPlan, Meal, MealNutrition } from '../../types/domain';
import { mockNutritionService } from './nutritionMock';

const BREAKFAST_NUTRITION: MealNutrition = {
  calories: 480,
  proteinG: 32,
  carbohydratesG: 62,
  fatG: 12,
  fibreG: 8,
};

const LUNCH_NUTRITION: MealNutrition = {
  calories: 650,
  proteinG: 48,
  carbohydratesG: 68,
  fatG: 18,
  fibreG: 10,
};

const SNACK_NUTRITION: MealNutrition = {
  calories: 220,
  proteinG: 18,
  carbohydratesG: 20,
  fatG: 7,
  fibreG: 3,
};

const DINNER_NUTRITION: MealNutrition = {
  calories: 590,
  proteinG: 47,
  carbohydratesG: 60,
  fatG: 21,
  fibreG: 7,
};

export const ENGINE_MEALS: Meal[] = [
  {
    id: 'meal-breakfast',
    mealType: 'breakfast',
    title: 'Breakfast',
    time: '8:30 AM',
    servingLabel: '1 hearty warm bowl',
    servings: 1,
    calories: 480,
    caloriesFormatted: '480 kcal',
    proteinG: 32,
    carbsG: 62,
    carbohydratesG: 62,
    fatG: 12,
    fibreG: 8,
    nutrition: BREAKFAST_NUTRITION,
    items: 'Ragi Banana Almond Cress Porridge',
    ingredients: [
      'Finger Millet (Ragi) Flour',
      'Ripe Banana',
      'Crushed Almonds',
      'Garden Cress Seeds',
      'Low-Fat Milk',
    ],
    scaledIngredientQuantities: [
      { name: 'Finger Millet (Ragi) Flour', amount: '50g' },
      { name: 'Ripe Banana', amount: '1 medium (100g)' },
      { name: 'Crushed Almonds', amount: '15g (1 tbsp)' },
      { name: 'Garden Cress Seeds', amount: '5g (1 tsp)' },
      { name: 'Low-Fat Milk', amount: '200ml' },
    ],
    preparationNote:
      'Whisk ragi flour in cold milk or water to prevent lumps. Simmer on low heat for 5-7 minutes until thick and glossy. Fold in sliced ripe banana, crushed almonds, and soaked garden cress seeds.',
    prepNote:
      'Whisk ragi flour in cold milk or water to prevent lumps. Simmer on low heat for 5-7 minutes until thick and glossy. Fold in sliced ripe banana, crushed almonds, and soaked garden cress seeds.',
    icon: 'coffee',
  },
  {
    id: 'meal-lunch',
    mealType: 'lunch',
    title: 'Lunch',
    time: '1:15 PM',
    servingLabel: '1 large balanced bowl',
    servings: 1,
    calories: 650,
    caloriesFormatted: '650 kcal',
    proteinG: 48,
    carbsG: 68,
    carbohydratesG: 68,
    fatG: 18,
    fibreG: 10,
    nutrition: LUNCH_NUTRITION,
    items: 'Lentil Bajra Vegetable Bowl',
    ingredients: [
      'Cooked Pearl Millet (Bajra)',
      'Mixed Lentil Dal (Moong & Toor)',
      'Chopped Spinach',
      'Carrots & Bottle Gourd',
      'Cold-Pressed Ghee',
    ],
    scaledIngredientQuantities: [
      { name: 'Cooked Pearl Millet (Bajra)', amount: '160g' },
      { name: 'Mixed Lentil Dal (Moong/Toor)', amount: '200g' },
      { name: 'Sauteed Spinach & Carrots', amount: '120g' },
      { name: 'Cold-Pressed Ghee', amount: '8g (1.5 tsp)' },
    ],
    preparationNote:
      'Pressure cook lentils with turmeric, salt, and diced vegetables until tender. Temper with cumin and ginger in warm ghee. Serve over steaming pearl millet bowl.',
    prepNote:
      'Pressure cook lentils with turmeric, salt, and diced vegetables until tender. Temper with cumin and ginger in warm ghee. Serve over steaming pearl millet bowl.',
    icon: 'sun',
  },
  {
    id: 'meal-evening-snack',
    mealType: 'evening_snack',
    title: 'Evening Snack',
    time: '4:45 PM',
    servingLabel: '1 fresh energizing bowl',
    servings: 1,
    calories: 220,
    caloriesFormatted: '220 kcal',
    proteinG: 18,
    carbsG: 20,
    carbohydratesG: 20,
    fatG: 7,
    fibreG: 3,
    nutrition: SNACK_NUTRITION,
    items: 'Chana Papaya Snack Bowl',
    ingredients: [
      'Boiled Brown Chickpeas (Kala Chana)',
      'Diced Fresh Papaya',
      'Roasted Cumin',
      'Lemon Juice',
      'Fresh Coriander',
    ],
    scaledIngredientQuantities: [
      { name: 'Boiled Kala Chana', amount: '90g' },
      { name: 'Fresh Papaya Cubes', amount: '120g' },
      { name: 'Lemon Juice & Cumin', amount: '1 tsp' },
    ],
    preparationNote:
      'Toss boiled chickpeas with diced ripe papaya, fresh lemon juice, roasted cumin powder, and chopped coriander leaves for a high-fibre prebiotic snack.',
    prepNote:
      'Toss boiled chickpeas with diced ripe papaya, fresh lemon juice, roasted cumin powder, and chopped coriander leaves for a high-fibre prebiotic snack.',
    icon: 'smile',
  },
  {
    id: 'meal-dinner',
    mealType: 'dinner',
    title: 'Dinner',
    time: '8:00 PM',
    servingLabel: '1 wholesome dinner plate',
    servings: 1,
    calories: 590,
    caloriesFormatted: '590 kcal',
    proteinG: 47,
    carbsG: 60,
    carbohydratesG: 60,
    fatG: 21,
    fibreG: 7,
    nutrition: DINNER_NUTRITION,
    items: 'Paneer Atta Vegetable Plate',
    ingredients: [
      'Low-Fat Fresh Paneer',
      'Whole Wheat Atta Rotis',
      'Mixed Stir-Fried Vegetables',
      'Cucumber Mint Curd',
      'Cold-Pressed Mustard Oil',
    ],
    scaledIngredientQuantities: [
      { name: 'Low-Fat Fresh Paneer', amount: '160g' },
      { name: 'Whole Wheat Atta Roti (2 pcs)', amount: '70g' },
      { name: 'Spiced French Beans & Bell Peppers', amount: '130g' },
      { name: 'Cucumber Mint Curd', amount: '100g' },
    ],
    preparationNote:
      'Lightly pan-sear low-fat paneer cubes with turmeric and bell peppers. Pair with two freshly prepared whole wheat rotis and chilled cucumber mint curd.',
    prepNote:
      'Lightly pan-sear low-fat paneer cubes with turmeric and bell peppers. Pair with two freshly prepared whole wheat rotis and chilled cucumber mint curd.',
    icon: 'moon',
  },
];

/** Base calories per meal type used to scale portions to the user's target. */
const BASE_CALORIES = {
  breakfast: 480,
  lunch: 650,
  evening_snack: 220,
  dinner: 590,
};

function scaledMeal(meal: Meal, scale: number): Meal {
  const calories = Math.max(80, Math.round(meal.calories * scale));
  return {
    ...meal,
    calories,
    caloriesFormatted: `${calories} kcal`,
    proteinG: Math.round(meal.proteinG * scale),
    carbsG: meal.carbsG != null ? Math.round(meal.carbsG * scale) : null,
    carbohydratesG: meal.carbohydratesG != null ? Math.round(meal.carbohydratesG * scale) : null,
    fatG: Math.round(meal.fatG * scale),
    fibreG: meal.fibreG != null ? Math.round(meal.fibreG * scale) : null,
    nutrition: {
      ...meal.nutrition,
      calories,
      proteinG: Math.round(meal.nutrition.proteinG * scale),
      carbohydratesG:
        meal.nutrition.carbohydratesG != null
          ? Math.round(meal.nutrition.carbohydratesG * scale)
          : null,
      fatG: Math.round(meal.nutrition.fatG * scale),
      fibreG:
        meal.nutrition.fibreG != null ? Math.round(meal.nutrition.fibreG * scale) : null,
    },
  };
}

export class MockMealService implements IMealService {
  async getDailyMealPlan(userId?: string, date?: string): Promise<MealPlan> {
    const targets = await mockNutritionService.getDailyTargets(userId, date);
    const baseTotal = Object.values(BASE_CALORIES).reduce((a, b) => a + b, 0);
    const scale = (targets.calories || baseTotal) / baseTotal;
    return {
      id: 'daily-plan-1',
      date: date || new Date().toISOString().split('T')[0],
      targets,
      meals: ENGINE_MEALS.map((m) => scaledMeal(m, scale)),
    };
  }

  async getWeeklyMealPlan(userId?: string): Promise<MealPlan[]> {
    const today = new Date();
    const days: MealPlan[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(await this.getDailyMealPlan(userId, d.toISOString().split('T')[0]));
    }
    return days;
  }

  async getMealByDate(date: string, userId?: string): Promise<MealPlan | null> {
    return this.getDailyMealPlan(userId, date);
  }
}

export const mockMealService = new MockMealService();
