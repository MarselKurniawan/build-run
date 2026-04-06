import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/database";
import { useState } from "react";
import {
  User as UserIcon,
  Shield,
  Edit2,
  LogOut,
  ChevronRight,
  Lock,
  Landmark,
  Settings,
  Share2,
  Headphones,
  Package,
  Wallet,
  Ticket,
  Building2,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Copy,
} from "lucide-react";
import ProfileDialog from "@/components/ProfileDialog";
import CouponDialog from "@/components/CouponDialog";
import BankAccountDialog from "@/components/BankAccountDialog";
import CompanyProfileDialog from "@/components/CompanyProfileDialog";
import RechargeDialog from "@/components/RechargeDialog";
import WithdrawDialog from "@/components/WithdrawDialog";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isAdmin, signOut, refreshProfile } = useAuth();
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"profile" | "password">("profile");
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const openProfileDialog = (mode: "profile" | "password") => {
    setDialogMode(mode);
    setProfileDialogOpen(true);
  };

  const handleCopyUID = () => {
    if (profile?.user_id) {
      navigator.clipboard.writeText(profile.user_id.slice(0, 8).toUpperCase());
      toast({ title: "Tersalin!", description: "UID berhasil disalin" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logout Berhasil", description: "Sampai jumpa lagi!" });
    navigate("/auth");
  };

  if (!profile) return null;

  const quickMenuItems = [
    {
      icon: Package,
      label: "Pesanan",
      description: "Riwayat investasi saya",
      href: "/account",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      icon: Wallet,
      label: "Tagihan",
      description: "Riwayat transaksi saya",
      href: "/account",
      color: "text-primary",
      bgColor: "bg-primary/5",
    },
    {
      icon: Crown,
      label: "VIP",
      description: `Level ${profile.vip_level}`,
      href: "/team",
      color: "text-vip-gold",
      bgColor: "bg-vip-gold/5",
    },
    {
      icon: Share2,
      label: "Peralatan",
      description: "Bentuk tim & undang",
      href: "/team",
      color: "text-destructive",
      bgColor: "bg-destructive/5",
    },
  ];

  const menuItems = [
    ...(isAdmin ? [{
      icon: Settings,
      label: "Admin Dashboard",
      description: "Kelola platform",
      action: () => navigate("/admin"),
      color: "text-destructive",
    }] : []),
    {
      icon: Edit2,
      label: "Update Profile",
      description: "Ubah nama dan telepon",
      action: () => openProfileDialog("profile"),
      color: "text-primary",
    },
    {
      icon: Lock,
      label: "Ganti Password",
      description: "Ubah password akun",
      action: () => openProfileDialog("password"),
      color: "text-accent",
    },
    {
      icon: Landmark,
      label: "Rekening Bank",
      description: "Kelola rekening & e-wallet",
      action: () => setBankDialogOpen(true),
      color: "text-primary",
    },
    {
      icon: Ticket,
      label: "Klaim Kupon",
      description: "Masukkan kode kupon",
      action: () => setCouponDialogOpen(true),
      color: "text-vip-gold",
    },
    {
      icon: Building2,
      label: "Profil Perusahaan",
      description: "Informasi InvestPro",
      action: () => setCompanyDialogOpen(true),
      color: "text-primary",
    },
    {
      icon: Headphones,
      label: "Hubungi Kami",
      description: "Customer service",
      action: () => {
        toast({
          title: "Hubungi Kami",
          description: "WhatsApp: +62 812-3456-7890",
        });
      },
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-4 p-4 pt-6">
      {/* User Profile Header */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-border">
          <UserIcon className="w-8 h-8 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground truncate">{profile.name}</h2>
            <Badge variant="vip" className="text-[10px] px-1.5 py-0.5 shrink-0">VIP{profile.vip_level}</Badge>
            {isAdmin && (
              <Badge variant="outline" className="border-primary/50 text-primary text-[10px] px-1.5 py-0.5 shrink-0">
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-muted-foreground">UID {profile.user_id.slice(0, 8).toUpperCase()}</p>
            <button onClick={handleCopyUID} className="text-muted-foreground hover:text-foreground">
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Bergabung: {new Date(profile.updated_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-vip-gold/10 border-primary/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-muted-foreground">Saldo total</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground hover:text-foreground">
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            {showBalance ? formatCurrency(profile.balance) : '••••••••'}
          </p>
          <div className="flex items-center gap-4 text-[11px] mb-4">
            <span className="text-success">Keuntungan: {formatCurrency(profile.total_income)}</span>
            <span className="text-muted-foreground">Total pendapatan: {formatCurrency(profile.total_income)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-10 text-sm font-semibold"
              onClick={() => setRechargeOpen(true)}
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              Deposito
            </Button>
            <Button
              variant="outline"
              className="h-10 text-sm font-semibold"
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowDownRight className="w-4 h-4 mr-1.5" />
              Menarik
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Menu Grid - 4 cards */}
      <div className="grid grid-cols-2 gap-3">
        {quickMenuItems.map((item) => (
          <Card 
            key={item.label} 
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => item.href && navigate(item.href)}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <div className={`w-9 h-9 rounded-full ${item.bgColor} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu List */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              <button
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              {index < menuItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/20">
        <CardContent className="p-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/10 transition-colors text-destructive"
          >
            <span className="text-xs font-medium flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Keluar
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} mode={dialogMode} onSuccess={refreshProfile} />
      <CouponDialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen} onSuccess={refreshProfile} />
      <BankAccountDialog open={bankDialogOpen} onOpenChange={setBankDialogOpen} onSuccess={refreshProfile} />
      <CompanyProfileDialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen} />
      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} onSuccess={refreshProfile} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={profile.balance} onSuccess={refreshProfile} />
    </div>
  );
};

export default Profile;
