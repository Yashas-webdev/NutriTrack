import { useState, useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: string;
  meal_type: string;
  meal_date: string;
  meal_time: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  image_url: string | null;
  notes: string | null;
}

export function MealHistory() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  useEffect(() => {
    loadMeals();
  }, [user, filter]);

  const loadMeals = async () => {
    if (!user) return;

    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .order('meal_time', { ascending: false })
      .limit(20);

    if (filter !== 'all') {
      query = query.eq('meal_type', filter);
    }

    const { data, error } = await query;

    if (data) {
      setMeals(data);
    }
    setLoading(false);
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (!error) {
      setMeals(meals.filter(m => m.id !== mealId));
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-amber-100 text-amber-700';
      case 'lunch': return 'bg-blue-100 text-blue-700';
      case 'dinner': return 'bg-violet-100 text-violet-700';
      case 'snack': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading meals...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">Meal History</h2>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === type
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {meals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No meals recorded yet. Start tracking your meals!
          </div>
        ) : (
          meals.map(meal => (
            <div key={meal.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMealTypeColor(meal.meal_type)}`}>
                      {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(meal.meal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' at '}
                      {meal.meal_time}
                    </span>
                  </div>

                  {meal.image_url && (
                    <img
                      src={meal.image_url}
                      alt="Meal"
                      className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">Calories</p>
                      <p className="text-lg font-bold text-blue-900">{meal.total_calories}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs text-emerald-600 mb-1">Protein</p>
                      <p className="text-lg font-bold text-emerald-900">{meal.total_protein?.toFixed(1)}g</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs text-amber-600 mb-1">Carbs</p>
                      <p className="text-lg font-bold text-amber-900">{meal.total_carbs?.toFixed(1)}g</p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3">
                      <p className="text-xs text-violet-600 mb-1">Fat</p>
                      <p className="text-lg font-bold text-violet-900">{meal.total_fat?.toFixed(1)}g</p>
                    </div>
                  </div>

                  {meal.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {meal.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="ml-4 text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
