import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DailySummary {
  summary_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

interface UserTargets {
  daily_calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [targets, setTargets] = useState<UserTargets>({
    daily_calorie_target: 2000,
    protein_target: 150,
    carbs_target: 200,
    fat_target: 65
  });
  const [weeklyData, setWeeklyData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [summaryRes, profileRes, weeklyRes] = await Promise.all([
      supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('summary_date', today)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('daily_calorie_target, protein_target, carbs_target, fat_target')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('summary_date', weekAgo)
        .order('summary_date', { ascending: true })
    ]);

    if (summaryRes.data) {
      setTodaySummary(summaryRes.data);
    }

    if (profileRes.data) {
      setTargets(profileRes.data);
    }

    if (weeklyRes.data) {
      setWeeklyData(weeklyRes.data);
    }

    setLoading(false);
  };

  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const calorieProgress = calculateProgress(
    todaySummary?.total_calories || 0,
    targets.daily_calorie_target
  );
  const proteinProgress = calculateProgress(
    todaySummary?.total_protein || 0,
    targets.protein_target
  );
  const carbsProgress = calculateProgress(
    todaySummary?.total_carbs || 0,
    targets.carbs_target
  );
  const fatProgress = calculateProgress(
    todaySummary?.total_fat || 0,
    targets.fat_target
  );

  const avgCalories = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, day) => sum + Number(day.total_calories), 0) / weeklyData.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Today's Progress</h2>
            <p className="text-emerald-100">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-emerald-100 text-sm mb-1">Calories</p>
            <p className="text-3xl font-bold mb-2">
              {todaySummary?.total_calories || 0}
              <span className="text-lg font-normal text-emerald-100">/{targets.daily_calorie_target}</span>
            </p>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-emerald-100 text-sm mb-1">Protein</p>
            <p className="text-3xl font-bold mb-2">
              {todaySummary?.total_protein?.toFixed(1) || 0}
              <span className="text-lg font-normal text-emerald-100">/{targets.protein_target}g</span>
            </p>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${proteinProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-emerald-100 text-sm mb-1">Carbs</p>
            <p className="text-3xl font-bold mb-2">
              {todaySummary?.total_carbs?.toFixed(1) || 0}
              <span className="text-lg font-normal text-emerald-100">/{targets.carbs_target}g</span>
            </p>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${carbsProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-emerald-100 text-sm mb-1">Fat</p>
            <p className="text-3xl font-bold mb-2">
              {todaySummary?.total_fat?.toFixed(1) || 0}
              <span className="text-lg font-normal text-emerald-100">/{targets.fat_target}g</span>
            </p>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${fatProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Weekly Overview</h3>
          </div>
          {weeklyData.length > 0 ? (
            <div className="space-y-3">
              {weeklyData.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.summary_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${getProgressColor(
                          (Number(day.total_calories) / targets.daily_calorie_target) * 100
                        )}`}
                        style={{ width: `${Math.min((Number(day.total_calories) / targets.daily_calorie_target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {day.total_calories} cal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data for the past week</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Average Daily Calories</p>
              <p className="text-2xl font-bold text-blue-900">{avgCalories}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-700 mb-1">Days Tracked This Week</p>
              <p className="text-2xl font-bold text-emerald-900">{weeklyData.length}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-700 mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-amber-900">{weeklyData.length} days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
