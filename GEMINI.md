# GEMINI.md - Nutri Companion

## Project Overview
Nutri Companion is a comprehensive health and nutrition management application. It allows users to track their daily meals, plan their weekly nutrition, manage recipes, generate shopping lists, and monitor digestive health.

### Core Technologies
- **Frontend Framework:** React 18 with Vite (SWC)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & shadcn/ui
- **Icons:** Lucide React
- **Routing:** React Router DOM (v6)
- **Data Fetching:** TanStack Query (React Query v5)
- **Backend & Auth:** Supabase
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts
- **Testing:** Vitest & React Testing Library

## Directory Structure
- `src/components/ui`: Atomic UI components (buttons, cards, inputs, etc.) based on shadcn/ui.
- `src/components/layout`: Application layout components like `AppLayout`.
- `src/components/nutrition`: Feature-specific components for meal tracking and nutrition visualization.
- `src/hooks`: Custom React hooks (e.g., `useAuth`, `useConsumedMeals`).
- `src/lib`: Business logic and utility functions:
  - `nutritionUtils.ts`: Logic for shopping list generation and macro calculations.
  - `foodUtils.ts`: Food name normalization and parsing.
  - `digestiveUtils.ts`: Helpers for digestive health tracking.
  - `dateUtils.ts`: Date formatting and manipulation.
- `src/pages`: Main view components (Dashboard, Recipes, ShoppingList, etc.).
- `src/types`: TypeScript interfaces and types for nutrition and application data.
- `src/test`: Vitest test suites.
- `supabase/`: Supabase configuration, migrations, and edge functions.

## AI Collaboration & Architectural Strategy
### Minimal Schema Changes
When resolving constraint violations or data edge cases, prefer **frontend-side logic** (e.g., clamping values, validation) over modifying the database schema unless the change is structurally necessary. This keeps the Supabase schema lean and minimizes migration overhead.

### AI Synchronization
Always prioritize strategies defined in `.lovable/plan.md`. When developing features or fixing bugs, ensure your logic aligns with the architectural direction established by other AI agents to maintain a unified and consistent codebase.

## Features & Business Logic
### Digestive Scoring System
The application includes a unique `DigestiveScore` calculation (`src/lib/digestiveUtils.ts`) that analyzes recipe ingredients against known irritants (lactose, gluten, high fat, spicy foods, legumes, cruciferous vegetables). It assigns a score from 1 (irritant) to 10 (gentle) and provides descriptive labels like "Muy suave" or "Puede irritar".

### Shopping List Generation
The `generateShoppingList` utility (`src/lib/nutritionUtils.ts`) aggregates ingredients from a `DayPlan`, normalizes their names, and groups them by category (e.g., protein, dairy, vegetables) for an efficient shopping experience.

## Backend & Edge Functions
### Digestive Analysis (`supabase/functions/digestive-analysis`)
A Deno-based Edge Function that provides advanced health insights:
- **Correlation Engine:** Analyzes `digestive_logs` against `consumed_meals` within a 72-hour window to identify trigger foods ("Suspects") and well-tolerated foods ("Safe Foods").
- **Symptom Scoring:** Implements a weighted scoring algorithm for digestive symptoms (Bristol scale, pain, bloating, etc.).
- **AI Integration:** Leverages LLMs (via Lovable API) to generate personalized, emoji-rich digestive health summaries and actionable recommendations.
- **Experiment Tracking:** Quantifies the impact of "Food Experiments" by comparing symptom averages before and after introducing a specific food item.

## Building and Running
### Development
```bash
npm run dev
```
Starts the Vite development server.

### Build
```bash
npm run build
```
Compiles the application for production.

### Testing
```bash
npm run test        # Runs tests once
npm run test:watch  # Runs tests in watch mode
```

### Linting
```bash
npm run lint
```

## Development Conventions
- **Component Pattern:** Use functional components with TypeScript. Prefer `const ComponentName = () => { ... }` syntax.
- **State Management:** Use TanStack Query for server state and standard React hooks for local state.
- **Styling:** Use Tailwind CSS for all styling. Follow shadcn/ui patterns for new UI components.
- **Type Safety:** Define interfaces in `src/types/` and use them consistently throughout the app.
- **Backend Interaction:** All database and auth interactions should go through the Supabase client in `src/integrations/supabase/client.ts`.
- **Testing:** Write unit tests for utility functions in `src/lib/` and integration tests for critical UI components.
- **Language:** The UI is primarily in Spanish, while code (variable names, comments) is in English.

## Key Files
- `src/App.tsx`: Main routing and provider setup.
- `src/hooks/useAuth.tsx`: Authentication context and Supabase auth integration.
- `src/lib/nutritionUtils.ts`: Core logic for processing meal plans and recipes.
- `src/integrations/supabase/types.ts`: Auto-generated types from the Supabase database schema.
