import { useState } from 'react';
import { Camera, BarChart3, User, Sparkles, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ImageCapture } from './ImageCapture';
import { FoodDetection } from './FoodDetection';
import { Dashboard } from './Dashboard';
import { UserProfile } from './UserProfile';
import { MealRecommendations } from './MealRecommendations';
import { MealHistory } from './MealHistory';
import { supabase } from '../lib/supabase';

type Tab = 'capture' | 'dashboard' | 'profile' | 'recommendations' | 'history';

interface DetectedFood {
  id: string;
  name: string;
  portionGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function MainApp() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const handleImageCapture = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFoodConfirmed = async (foods: DetectedFood[]) => {
    if (!user) return;

    const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

    const now = new Date();
    const mealDate = now.toISOString().split('T')[0];
    const mealTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        meal_type: selectedMealType,
        image_url: capturedImage,
        meal_date: mealDate,
        meal_time: mealTime,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat
      })
      .select()
      .single();

    if (mealData) {
      const mealItems = foods.map(food => ({
        meal_id: mealData.id,
        food_name: food.name,
        portion_size_grams: food.portionGrams,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat
      }));

      await supabase.from('meal_items').insert(mealItems);

      const { data: existingSummary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('summary_date', mealDate)
        .maybeSingle();

      if (existingSummary) {
        await supabase
          .from('daily_summaries')
          .update({
            total_calories: Number(existingSummary.total_calories) + totalCalories,
            total_protein: Number(existingSummary.total_protein) + totalProtein,
            total_carbs: Number(existingSummary.total_carbs) + totalCarbs,
            total_fat: Number(existingSummary.total_fat) + totalFat,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSummary.id);
      } else {
        await supabase.from('daily_summaries').insert({
          user_id: user.id,
          summary_date: mealDate,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat
        });
      }
    }

    setCapturedImage(null);
    setActiveTab('dashboard');
  };

  const handleCancelDetection = () => {
    setCapturedImage(null);
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'capture' as Tab, label: 'Capture', icon: Camera },
    { id: 'history' as Tab, label: 'History', icon: Clock },
    { id: 'recommendations' as Tab, label: 'Meal Plans', icon: Sparkles },
    { id: 'profile' as Tab, label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">NutriTrack</h1>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'capture' && !capturedImage && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Meal Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      selectedMealType === type
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ImageCapture onImageCapture={handleImageCapture} />
          </div>
        )}

        {activeTab === 'capture' && capturedImage && (
          <FoodDetection
            imageUrl={capturedImage}
            onFoodConfirmed={handleFoodConfirmed}
            onCancel={handleCancelDetection}
          />
        )}

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'profile' && <UserProfile />}
        {activeTab === 'recommendations' && <MealRecommendations />}
        {activeTab === 'history' && <MealHistory />}
      </div>
    </div>
  );
}
