import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Home, Store, LayoutGrid, UserCircle, Wallet, ArrowUpRight, ArrowDownRight, Gift, Landmark, BarChart3, Settings, Headphones, Share2, Building2, History, Plane } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RabatInfoDialog from "@/components/RabatInfoDialog";

interface QuickMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickMenuSheet = ({ open, onOpenChange }: QuickMenuSheetProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [rabatDialogOpen, setRabatDialogOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const menuGroups = [
    {
      title: "Navigasi", items: [
        { icon: Home, label: "Rumah", path: "/", color: "text-primary" },
        { icon: Store, label: "Toko Drone", path: "/product", color: "text-accent" },
        { icon: LayoutGrid, label: "Tim", path: "/team", color: "text-success" },
        { icon: UserCircle, label: "Saya", path: "/profile", color: "text-vip-gold" },
      ]
    },
    {
      title: "Keuangan", items: [
        { icon: ArrowUpRight, label: "Isi Ulang", path: "/", color: "text-success" },
        { icon: ArrowDownRight, label: "Tarik", path: "/", color: "text-accent" },
        { icon: Plane, label: "Drone Saya", path: "/account", color: "text-primary" },
        { icon: BarChart3, label: "Catatan Penerbangan", path: "/account", color: "text-vip-gold" },
      ]
    },
    {
      title: "Akun", items: [
        { icon: Landmark, label: "Manajemen Bank", path: "/profile", color: "text-primary" },
        { icon: Gift, label: "Keberuntungan", path: "/profile", color: "text-vip-gold" },
        { icon: History, label: "Catatan Komisi", path: "/commission-history", color: "text-success" },
        { icon: Share2, label: "Undang Pengguna", path: "/team", color: "text-accent" },
      ]
    },
    {
      title: "Bantuan", items: [
        { icon: Building2, label: "Tentang Kami", path: "/profile", color: "text-primary" },
        { icon: Headphones, label: "Pelayanan Pelanggan", path: "/profile", color: "text-accent" },
        ...(isAdmin ? [{ icon: Settings, label: "Admin Panel", path: "/admin", color: "text-destructive" }] : []),
      ]
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl bg-card border-border/60">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-base">Menu Cepat</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 overflow-y-auto max-h-[calc(70vh-100px)] pb-8">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[11px] font-medium text-muted-foreground mb-2 px-1">{group.title}</h3>
                <div className="grid grid-cols-4 gap-2.5">
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => item.path && handleNavigate(item.path)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-full bg-background flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-foreground text-center leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <RabatInfoDialog open={rabatDialogOpen} onOpenChange={setRabatDialogOpen} />
    </>
  );
};

export default QuickMenuSheet;
