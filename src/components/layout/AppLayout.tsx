import { Outlet, NavLink } from "react-router-dom";
import { Home, Calendar, BookOpen, ShoppingBag, Pill } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Hoy" },
  { to: "/plan", icon: Calendar, label: "Plan" },
  { to: "/recetas", icon: BookOpen, label: "Recetas" },
  { to: "/compras", icon: ShoppingBag, label: "Compras" },
  { to: "/suplementos", icon: Pill, label: "Suplem." },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs transition-colors ${
    isActive ? "text-primary font-medium" : "text-muted-foreground"
  }`;

const AppLayout = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-primary tracking-tight">
          Nutriologo Pro
        </h1>
      </div>
    </header>

    <nav className="hidden md:block sticky top-[57px] z-30 border-b border-border bg-card">
      <div className="max-w-2xl mx-auto px-4 flex gap-1">
        {navItems.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>

    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <Outlet />
    </main>

    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
      <div className="flex justify-around py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={mobileLinkClass}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  </div>
);

export default AppLayout;
