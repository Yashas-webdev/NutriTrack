import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DetectedFood {
  id: string;
  name: string;
  portionGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notInDatabase?: boolean;
}

interface FoodDetectionProps {
  imageUrl: string;
  onFoodConfirmed: (foods: DetectedFood[]) => void;
  onCancel: () => void;
}

export function FoodDetection({ imageUrl, onFoodConfirmed, onCancel }: FoodDetectionProps) {
  const [detecting, setDetecting] = useState(true);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [customFood, setCustomFood] = useState({ name: '', portionGrams: 100 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectFood();
  }, [imageUrl]);

  const detectFood = async () => {
    try {
      setDetecting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Please sign in to use food detection');
        setDetecting(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-food`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect food');
      }

      const result = await response.json();

      if (result.foods && result.foods.length > 0) {
        setDetectedFoods(result.foods);
      } else {
        setError('No foods detected in the image. Please add foods manually below.');
      }
    } catch (err) {
      console.error('Food detection error:', err);
      setError('Failed to detect food. Please add foods manually.');
    } finally {
      setDetecting(false);
    }
  };

  const updatePortion = (id: string, grams: number) => {
    setDetectedFoods(foods => foods.map(food => {
      if (food.id === id) {
        const ratio = grams / food.portionGrams;
        return {
          ...food,
          portionGrams: grams,
          calories: Math.round(food.calories * ratio),
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10
        };
      }
      return food;
    }));
  };

  const removeFood = (id: string) => {
    setDetectedFoods(foods => foods.filter(f => f.id !== id));
  };

  const addCustomFood = () => {
    if (customFood.name && customFood.portionGrams > 0) {
      const newFood: DetectedFood = {
        id: Date.now().toString(),
        name: customFood.name,
        portionGrams: customFood.portionGrams,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      setDetectedFoods([...detectedFoods, newFood]);
      setCustomFood({ name: '', portionGrams: 100 });
    }
  };

  const totalNutrition = detectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative">
        <img
          src={imageUrl}
          alt="Meal"
          className="w-full h-64 object-cover"
        />
        {detecting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Analyzing your meal...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {!detecting && (
          <>
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium">Detection Issue</p>
                  <p className="text-yellow-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Detected Foods {detectedFoods.length > 0 && `(${detectedFoods.length})`}
              </h3>
            </div>

            {detectedFoods.length > 0 && (
              <div className="space-y-3 mb-6">
                {detectedFoods.map(food => (
                <div
                  key={food.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{food.name}</h4>
                        {food.notInDatabase && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Not in DB
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => removeFood(food.id)}
                      className="text-red-500 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      Portion:
                    </label>
                    <input
                      type="number"
                      value={food.portionGrams}
                      onChange={(e) => updatePortion(food.id, Number(e.target.value))}
                      className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">grams</span>
                  </div>
                </div>
              ))}
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-gray-800">Add Custom Food</h4>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Food name"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Grams"
                  value={customFood.portionGrams}
                  onChange={(e) => setCustomFood({ ...customFood, portionGrams: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="1"
                />
                <button
                  onClick={addCustomFood}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>

            {detectedFoods.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-6 text-white mb-6">
                <h4 className="font-semibold mb-4 text-lg">Total Nutrition</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-emerald-100 text-sm">Calories</p>
                    <p className="text-2xl font-bold">{totalNutrition.calories}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Protein</p>
                    <p className="text-2xl font-bold">{totalNutrition.protein.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Carbs</p>
                    <p className="text-2xl font-bold">{totalNutrition.carbs.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Fat</p>
                    <p className="text-2xl font-bold">{totalNutrition.fat.toFixed(1)}g</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onFoodConfirmed(detectedFoods)}
                disabled={detectedFoods.length === 0}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Meal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
