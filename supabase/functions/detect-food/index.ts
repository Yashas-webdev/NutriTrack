import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");

interface FoodItem {
  name: string;
  portionGrams: number;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(imageBuffer))
    );

    // Use Google Gemini Vision API for food detection
    let detectedFoods: FoodItem[] = [];

    if (GOOGLE_AI_KEY) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Analyze this food image and identify ALL food items visible. For each item, provide: 1) The exact food name (prefer Indian food names if applicable), 2) Estimated portion size in grams. Return ONLY a JSON array like this: [{"name": "Food Name", "portionGrams": 150, "confidence": 0.9}]. Be specific with food names (e.g., "Tandoori Chicken" not just "Chicken"). If you see multiple items, list them all.',
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      
      if (geminiData.candidates && geminiData.candidates[0]) {
        const textResponse = geminiData.candidates[0].content.parts[0].text;
        // Extract JSON from the response
        const jsonMatch = textResponse.match(/\[.*\]/s);
        if (jsonMatch) {
          detectedFoods = JSON.parse(jsonMatch[0]);
        }
      }
    }

    // If no foods detected or no API key, return empty array
    if (detectedFoods.length === 0) {
      return new Response(
        JSON.stringify({ foods: [], message: "No foods detected. Please add manually." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Match detected foods with database
    const enrichedFoods = await Promise.all(
      detectedFoods.map(async (food) => {
        // Search for the food in the database (case-insensitive, fuzzy match)
        const { data: dbFoods } = await supabase
          .from("food_items")
          .select("*")
          .ilike("name", `%${food.name}%`)
          .limit(1);

        if (dbFoods && dbFoods.length > 0) {
          const dbFood = dbFoods[0];
          const multiplier = food.portionGrams / 100;
          return {
            id: dbFood.id,
            name: dbFood.name,
            portionGrams: food.portionGrams,
            calories: Math.round(parseFloat(dbFood.calories_per_100g) * multiplier),
            protein: Math.round(parseFloat(dbFood.protein_per_100g) * multiplier * 10) / 10,
            carbs: Math.round(parseFloat(dbFood.carbs_per_100g) * multiplier * 10) / 10,
            fat: Math.round(parseFloat(dbFood.fat_per_100g) * multiplier * 10) / 10,
            confidence: food.confidence,
          };
        }

        // If not found in DB, return with zero nutrition
        return {
          id: `temp-${Date.now()}-${Math.random()}`,
          name: food.name,
          portionGrams: food.portionGrams,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          confidence: food.confidence,
          notInDatabase: true,
        };
      })
    );

    return new Response(
      JSON.stringify({ foods: enrichedFoods }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error detecting food:", error);
    return new Response(
      JSON.stringify({ error: "Failed to detect food", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
