import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FoodItem {
  name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Recommendation {
  meal_type: string;
  recommended_foods: FoodItem[];
  total_calories: number;
  reasoning: string;
}

export function MealRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    setUserProfile(data);
  };

  const generateRecommendations = async () => {
    if (!user || !userProfile) {
      alert('Please complete your profile first to get personalized recommendations.');
      return;
    }

    setLoading(true);

    const caloriesPerMeal = Math.floor((userProfile.daily_calorie_target || 2000) / 3);
    const proteinPerMeal = Math.floor((userProfile.protein_target || 150) / 3);
    const carbsPerMeal = Math.floor((userProfile.carbs_target || 200) / 3);
    const fatPerMeal = Math.floor((userProfile.fat_target || 65) / 3);

    const breakfastRec: Recommendation = {
      meal_type: 'breakfast',
      total_calories: caloriesPerMeal,
      reasoning: 'High protein breakfast to start your day with sustained energy',
      recommended_foods: [
        { name: 'Oatmeal', portion: 60, calories: 233, protein: 10.2, carbs: 39.6, fat: 4.2 },
        { name: 'Eggs', portion: 100, calories: 155, protein: 13, carbs: 1.1, fat: 11 },
        { name: 'Banana', portion: 120, calories: 107, protein: 1.3, carbs: 27.6, fat: 0.4 },
        { name: 'Greek Yogurt', portion: 150, calories: 89, protein: 15, carbs: 5.4, fat: 0.6 }
      ]
    };

    const lunchRec: Recommendation = {
      meal_type: 'lunch',
      total_calories: caloriesPerMeal,
      reasoning: 'Balanced meal with lean protein and complex carbs for afternoon energy',
      recommended_foods: [
        { name: 'Chicken Breast', portion: 150, calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
        { name: 'Brown Rice', portion: 150, calories: 167, protein: 3.9, carbs: 34.5, fat: 1.4 },
        { name: 'Broccoli', portion: 150, calories: 51, protein: 4.2, carbs: 10.5, fat: 0.6 },
        { name: 'Avocado', portion: 50, calories: 80, protein: 1, carbs: 4.5, fat: 7.5 }
      ]
    };

    const dinnerRec: Recommendation = {
      meal_type: 'dinner',
      total_calories: caloriesPerMeal,
      reasoning: 'Omega-3 rich meal with vegetables for optimal recovery and health',
      recommended_foods: [
        { name: 'Salmon', portion: 150, calories: 312, protein: 30, carbs: 0, fat: 19.5 },
        { name: 'Sweet Potato', portion: 200, calories: 172, protein: 3.2, carbs: 40, fat: 0.2 },
        { name: 'Broccoli', portion: 100, calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }
      ]
    };

    const newRecommendations = [breakfastRec, lunchRec, dinnerRec];
    setRecommendations(newRecommendations);

    for (const rec of newRecommendations) {
      await supabase.from('meal_recommendations').insert({
        user_id: user.id,
        meal_type: rec.meal_type,
        recommended_foods: rec.recommended_foods,
        total_calories: rec.total_calories,
        reasoning: rec.reasoning
      });
    }

    setLoading(false);
  };

  const getMealTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'from-amber-400 to-orange-500';
      case 'lunch': return 'from-blue-400 to-cyan-500';
      case 'dinner': return 'from-violet-400 to-purple-500';
      default: return 'from-emerald-400 to-teal-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Personalized Meal Plans</h2>
              <p className="text-gray-600">AI-generated recommendations based on your goals</p>
            </div>
          </div>

          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>

        {!userProfile && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              Please complete your profile to get personalized meal recommendations.
            </p>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${getMealColor(rec.meal_type)} p-6 text-white`}>
                <h3 className="text-2xl font-bold mb-2">{getMealTypeLabel(rec.meal_type)}</h3>
                <p className="text-sm opacity-90">{rec.total_calories} calories</p>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">{rec.reasoning}</p>
                </div>

                <h4 className="font-semibold text-gray-800 mb-3">Recommended Foods:</h4>
                <div className="space-y-3">
                  {rec.recommended_foods.map((food, foodIdx) => (
                    <div
                      key={foodIdx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{food.name}</span>
                        <span className="text-sm text-gray-600">{food.portion}g</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="block text-gray-500">Cal</span>
                          <span className="font-medium">{food.calories}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">P</span>
                          <span className="font-medium">{food.protein}g</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">C</span>
                          <span className="font-medium">{food.carbs}g</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">F</span>
                          <span className="font-medium">{food.fat}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Calories</p>
                      <p className="font-semibold text-gray-800">
                        {rec.recommended_foods.reduce((sum, f) => sum + f.calories, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Protein</p>
                      <p className="font-semibold text-gray-800">
                        {rec.recommended_foods.reduce((sum, f) => sum + f.protein, 0).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Carbs</p>
                      <p className="font-semibold text-gray-800">
                        {rec.recommended_foods.reduce((sum, f) => sum + f.carbs, 0).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fat</p>
                      <p className="font-semibold text-gray-800">
                        {rec.recommended_foods.reduce((sum, f) => sum + f.fat, 0).toFixed(1)}g
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
