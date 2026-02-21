

# Food Photo Recognition Feature

## Overview
Add the ability to take or upload a photo of a meal and have AI identify the foods and estimate portions. The result can then be logged as a consumed meal.

## How It Works

1. User taps a camera/upload button on the Dashboard
2. They take a photo or select one from their gallery
3. The image is sent to a new backend function that uses Lovable AI (Gemini, which supports images) to analyze it
4. The AI returns a list of identified foods with estimated portions, calories, and protein
5. The user reviews and confirms, then the meal is saved to `consumed_meals`

## Technical Plan

### 1. New backend function: `supabase/functions/analyze-meal-photo/index.ts`
- Accepts a base64-encoded image in the request body
- Sends it to the Lovable AI Gateway using `google/gemini-3-flash-preview` (supports image input)
- Uses tool calling to extract structured output: an array of `{ food_name, estimated_grams, estimated_calories, estimated_protein }`
- Returns the structured result to the client
- Handles 429/402 rate limit errors

### 2. Update `supabase/config.toml`
- Add the new function entry with `verify_jwt = false`

### 3. New component: `src/components/meals/MealPhotoAnalyzer.tsx`
- A button that opens a file input (accept="image/*" with capture support for mobile cameras)
- Converts the selected image to base64
- Calls the backend function
- Shows a loading state while analyzing
- Displays results in a review card: list of detected foods with portions
- "Confirmar" button saves the meal to `consumed_meals` via Supabase

### 4. Update `src/pages/Dashboard.tsx`
- Add the `MealPhotoAnalyzer` component near the meals section
- On confirmation, insert into `consumed_meals` and refresh the consumed meals list

### 5. Fix existing build error in `digestive-analysis/index.ts`
- Add `log_date` to the `DigestiveLog` type definition (it exists in the DB but is missing from the local type)

## Details

**AI Prompt Strategy**: The backend function will use tool calling to get structured JSON output with food names, grams, calories, and protein estimates. The system prompt will instruct the model to identify Latin American / Spanish cuisine when relevant (matching the app's language).

**Image Handling**: Images will be sent as base64 data URLs in the request body. No storage bucket is needed since images are only used for analysis and not persisted.

**Mobile-First**: The file input will use `capture="environment"` to open the camera directly on mobile devices, with a fallback to file selection.

