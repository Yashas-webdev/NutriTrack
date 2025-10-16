/*
  # Nutrition Tracking System Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `age` (integer)
      - `weight` (decimal)
      - `height` (decimal)
      - `gender` (text)
      - `activity_level` (text)
      - `dietary_preferences` (jsonb) - stores preferences like vegetarian, vegan, etc.
      - `health_conditions` (jsonb) - stores conditions like diabetes, allergies, etc.
      - `fitness_goals` (text) - weight loss, muscle gain, maintenance, etc.
      - `daily_calorie_target` (integer)
      - `protein_target` (integer)
      - `carbs_target` (integer)
      - `fat_target` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `food_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `calories_per_100g` (decimal)
      - `protein_per_100g` (decimal)
      - `carbs_per_100g` (decimal)
      - `fat_per_100g` (decimal)
      - `fiber_per_100g` (decimal)
      - `category` (text) - fruit, vegetable, protein, grain, etc.
      - `created_at` (timestamptz)

    - `meals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `meal_type` (text) - breakfast, lunch, dinner, snack
      - `image_url` (text) - stored image path
      - `meal_date` (date)
      - `meal_time` (time)
      - `total_calories` (decimal)
      - `total_protein` (decimal)
      - `total_carbs` (decimal)
      - `total_fat` (decimal)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `meal_items`
      - `id` (uuid, primary key)
      - `meal_id` (uuid, references meals)
      - `food_item_id` (uuid, references food_items)
      - `food_name` (text)
      - `portion_size_grams` (decimal)
      - `calories` (decimal)
      - `protein` (decimal)
      - `carbs` (decimal)
      - `fat` (decimal)
      - `created_at` (timestamptz)

    - `daily_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `summary_date` (date)
      - `total_calories` (decimal)
      - `total_protein` (decimal)
      - `total_carbs` (decimal)
      - `total_fat` (decimal)
      - `water_intake_ml` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meal_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `meal_type` (text)
      - `recommended_foods` (jsonb) - array of food items with portions
      - `total_calories` (decimal)
      - `reasoning` (text) - why this meal was recommended
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Food items table is readable by all authenticated users
    - All other tables restricted to owner only
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer,
  weight decimal(5,2),
  height decimal(5,2),
  gender text CHECK (gender IN ('male', 'female', 'other')),
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_preferences jsonb DEFAULT '[]'::jsonb,
  health_conditions jsonb DEFAULT '[]'::jsonb,
  fitness_goals text CHECK (fitness_goals IN ('weight_loss', 'muscle_gain', 'maintenance', 'general_health')),
  daily_calorie_target integer,
  protein_target integer,
  carbs_target integer,
  fat_target integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories_per_100g decimal(7,2) NOT NULL,
  protein_per_100g decimal(5,2) DEFAULT 0,
  carbs_per_100g decimal(5,2) DEFAULT 0,
  fat_per_100g decimal(5,2) DEFAULT 0,
  fiber_per_100g decimal(5,2) DEFAULT 0,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  image_url text,
  meal_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_time time NOT NULL DEFAULT CURRENT_TIME,
  total_calories decimal(7,2) DEFAULT 0,
  total_protein decimal(6,2) DEFAULT 0,
  total_carbs decimal(6,2) DEFAULT 0,
  total_fat decimal(6,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create meal_items table
CREATE TABLE IF NOT EXISTS meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  food_item_id uuid REFERENCES food_items(id),
  food_name text NOT NULL,
  portion_size_grams decimal(7,2) NOT NULL,
  calories decimal(7,2) NOT NULL,
  protein decimal(6,2) DEFAULT 0,
  carbs decimal(6,2) DEFAULT 0,
  fat decimal(6,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create daily_summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary_date date NOT NULL,
  total_calories decimal(7,2) DEFAULT 0,
  total_protein decimal(6,2) DEFAULT 0,
  total_carbs decimal(6,2) DEFAULT 0,
  total_fat decimal(6,2) DEFAULT 0,
  water_intake_ml integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

-- Create meal_recommendations table
CREATE TABLE IF NOT EXISTS meal_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  recommended_foods jsonb DEFAULT '[]'::jsonb,
  total_calories decimal(7,2),
  reasoning text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for food_items (readable by all authenticated users)
CREATE POLICY "Anyone can view food items"
  ON food_items FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for meals
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meal_items
CREATE POLICY "Users can view own meal items"
  ON meal_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meals
    WHERE meals.id = meal_items.meal_id
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own meal items"
  ON meal_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meals
    WHERE meals.id = meal_items.meal_id
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own meal items"
  ON meal_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meals
    WHERE meals.id = meal_items.meal_id
    AND meals.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meals
    WHERE meals.id = meal_items.meal_id
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own meal items"
  ON meal_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meals
    WHERE meals.id = meal_items.meal_id
    AND meals.user_id = auth.uid()
  ));

-- RLS Policies for daily_summaries
CREATE POLICY "Users can view own daily summaries"
  ON daily_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries"
  ON daily_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries"
  ON daily_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for meal_recommendations
CREATE POLICY "Users can view own recommendations"
  ON meal_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON meal_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);

-- Insert some sample food items
INSERT INTO food_items (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, category)
VALUES
  ('Chicken Breast', 165, 31, 0, 3.6, 0, 'protein'),
  ('Brown Rice', 111, 2.6, 23, 0.9, 1.8, 'grain'),
  ('Broccoli', 34, 2.8, 7, 0.4, 2.6, 'vegetable'),
  ('Salmon', 208, 20, 0, 13, 0, 'protein'),
  ('Banana', 89, 1.1, 23, 0.3, 2.6, 'fruit'),
  ('Eggs', 155, 13, 1.1, 11, 0, 'protein'),
  ('Oatmeal', 389, 17, 66, 7, 11, 'grain'),
  ('Avocado', 160, 2, 9, 15, 7, 'fruit'),
  ('Sweet Potato', 86, 1.6, 20, 0.1, 3, 'vegetable'),
  ('Greek Yogurt', 59, 10, 3.6, 0.4, 0, 'dairy')
ON CONFLICT DO NOTHING;