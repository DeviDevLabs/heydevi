import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Calendar, ShoppingBag, Package, Heart, Pill, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const bottomTabs = [
  { to: "/", icon: Home, label: "Hoy" },
  { to: "/plan", icon: Calendar, label: "Plan" },
  { to: "/compras", icon: ShoppingBag, label: "Lista" },
  { to: "/inventario", icon: Package, label: "Invent." },
  { to: "/digestion/registro", icon: Heart, label: "Digest." },
];

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-1 py-1.5 text-xs transition-colors ${
    isActive ? "text-primary font-medium" : "text-muted-foreground"
  }`;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`;

const AppLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-primary tracking-tight">
            Nutriólogo Pro
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/suplementos")} title="Suplementos">
              <Pill className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/digestion/estadisticas")} title="Estadísticas digestivas">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/perfil")} title="Perfil">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut()} title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="hidden md:block sticky top-[57px] z-30 border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {bottomTabs.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>{label}</NavLink>
          ))}
          <NavLink to="/suplementos" className={linkClass}>Suplem.</NavLink>
          <NavLink to="/digestion/estadisticas" className={linkClass}>Stats</NavLink>
          <NavLink to="/perfil" className={linkClass}>Perfil</NavLink>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex justify-around py-1.5">
          {bottomTabs.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} className={mobileLinkClass}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
