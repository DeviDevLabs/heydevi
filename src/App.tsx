import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import WeeklyPlan from "@/pages/WeeklyPlan";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import ShoppingList from "@/pages/ShoppingList";
import Supplements from "@/pages/Supplements";
import Profile from "@/pages/Profile";
import Inventory from "@/pages/Inventory";
import DigestiveProfile from "@/pages/DigestiveProfile";
import DigestiveLog from "@/pages/DigestiveLog";
import DigestiveStats from "@/pages/DigestiveStats";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
      <Route path="/plan" element={<WeeklyPlan />} />
      <Route path="/recetas" element={<Recipes />} />
      <Route path="/recetas/:id" element={<RecipeDetail />} />
      <Route path="/compras" element={<ShoppingList />} />
      <Route path="/suplementos" element={<Supplements />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/inventario" element={<Inventory />} />
      <Route path="/digestion" element={<DigestiveProfile />} />
      <Route path="/digestion/registro" element={<DigestiveLog />} />
      <Route path="/digestion/estadisticas" element={<DigestiveStats />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
