import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Home, Package, Users, UserCircle, LayoutGrid } from "lucide-react";
import QuickMenuSheet from "@/components/QuickMenuSheet";

const Layout = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-background pb-20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-vip-gold/5 rounded-full blur-3xl" />
      </div>

      <div className={`mx-auto ${wide ? "max-w-4xl" : "max-w-md"} relative z-10`}>
        {children}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/20 backdrop-blur-xl bg-card/90">
        <div className="mx-auto max-w-md grid grid-cols-5 items-center py-3">
          <NavLink
            to="/"
            className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-all hover:text-primary"
            activeClassName="text-primary font-medium"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Beranda</span>
          </NavLink>
          
          <NavLink
            to="/product"
            className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-all hover:text-primary"
            activeClassName="text-primary font-medium"
          >
            <Package className="w-5 h-5" />
            <span className="text-xs">Produk</span>
          </NavLink>
          
          {/* Center Menu Button - Prominent */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 -mt-6"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-accent to-vip-gold flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-primary font-medium">Menu</span>
          </button>
          
          <NavLink
            to="/team"
            className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-all hover:text-primary"
            activeClassName="text-primary font-medium"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Tim</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-all hover:text-primary"
            activeClassName="text-primary font-medium"
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-xs">Profil</span>
          </NavLink>
        </div>
      </nav>

      {/* Quick Menu Sheet */}
      <QuickMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  );
};

export default Layout;
