import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Radio, ShieldCheck, Sun, Moon, LogOut, Sparkles, Gift, PartyPopper, Coins, ChevronRight, Trophy, Repeat, Zap, Bell, CalendarCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getProducts, getInvestments, formatCurrency, canClaimToday, updateInvestment, updateProfile, createTransaction, processReferralRabat, Product, Investment } from "@/lib/database";
import { useTheme } from "@/hooks/useTheme";
import RechargeDialog from "@/components/RechargeDialog";
import WithdrawDialog from "@/components/WithdrawDialog";
import InvestDialog from "@/components/InvestDialog";
import DailyCheckinDialog from "@/components/DailyCheckinDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const loadData = async () => {
    if (user) {
      const [investmentsData, productsData] = await Promise.all([
        getInvestments(user.id),
        getProducts()
      ]);
      setInvestments(investmentsData);
      setProducts(productsData);
    }
    await refreshProfile();
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Auto-claim: jalan setiap 60 detik untuk cek investasi yang sudah lewat 24 jam dari pembelian/klaim terakhir
  useEffect(() => {
    if (!user || !profile || investments.length === 0) return;

    const runAutoClaim = async () => {
      const claimable = investments.filter(inv =>
        inv.status === 'active' && canClaimToday(inv.last_claimed_at || inv.created_at || null)
      );
      if (claimable.length === 0) return;

      let total = 0;
      for (const inv of claimable) {
        const newEarned = inv.total_earned + inv.daily_income;
        const newDays = inv.days_remaining - 1;
        await updateInvestment(inv.id, {
          total_earned: newEarned,
          days_remaining: newDays,
          last_claimed_at: new Date().toISOString(),
          status: newDays <= 0 ? 'completed' : 'active',
        });
        await createTransaction({
          user_id: user.id,
          type: 'income',
          amount: inv.daily_income,
          status: 'success',
          description: `Profit otomatis ${inv.product_name}`,
        });
        await processReferralRabat(user.id, inv.daily_income);
        total += inv.daily_income;
      }
      if (total > 0) {
        await updateProfile(user.id, {
          balance: profile.balance + total,
          total_income: profile.total_income + total,
        });
        await loadData();
        toast({
          title: '💰 Profit Otomatis Masuk',
          description: `+${formatCurrency(total)} dari ${claimable.length} drone`,
        });
      }
    };

    runAutoClaim();
    const id = setInterval(runAutoClaim, 60_000);
    return () => clearInterval(id);
  }, [user, profile, investments]);


  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logout Berhasil", description: "Sampai jumpa lagi!" });
    navigate("/auth");
  };

  const balance = profile?.balance || 0;
  const vipLevel = profile?.vip_level || 0;

  const handleInvest = (product: Product) => {
    setSelectedProduct(product);
    setInvestOpen(true);
  };

  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalDailyIncome = activeInvestments.reduce((sum, i) => sum + i.daily_income, 0);
  const claimableInvestments = activeInvestments.filter(inv => canClaimToday(inv.last_claimed_at));
  const totalClaimable = claimableInvestments.reduce((sum, inv) => sum + inv.daily_income, 0);

  const handleOpenClaimDialog = () => {
    setClaimed(false);
    setShowConfetti(false);
    setClaimDialogOpen(true);
  };

  const handleClaimAll = async () => {
    if (!user || !profile || claimableInvestments.length === 0 || isClaiming) return;
    setIsClaiming(true);

    try {
      let totalClaimed = 0;
      for (const investment of claimableInvestments) {
        const newTotalEarned = investment.total_earned + investment.daily_income;
        const newDaysRemaining = investment.days_remaining - 1;

        await updateInvestment(investment.id, {
          total_earned: newTotalEarned,
          days_remaining: newDaysRemaining,
          last_claimed_at: new Date().toISOString(),
          status: newDaysRemaining <= 0 ? 'completed' : 'active'
        });

        await createTransaction({
          user_id: user.id,
          type: 'income',
          amount: investment.daily_income,
          status: 'success',
          description: `Pendapatan harian dari Drone ${investment.product_name}`
        });

        await processReferralRabat(user.id, investment.daily_income);
        totalClaimed += investment.daily_income;
      }

      await updateProfile(user.id, {
        balance: profile.balance + totalClaimed,
        total_income: profile.total_income + totalClaimed
      });

      setClaimed(true);
      setShowConfetti(true);
      await loadData();

      toast({
        title: "🎉 Klaim Berhasil!",
        description: `Anda mendapatkan ${formatCurrency(totalClaimed)} dari ${claimableInvestments.length} drone`,
      });

      setTimeout(() => setClaimDialogOpen(false), 2500);
    } catch (error) {
      console.error('Error claiming income:', error);
      toast({
        title: "Gagal Klaim",
        description: "Terjadi kesalahan saat mengklaim pendapatan.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const droneOnline = activeInvestments.length;

  return (
    <div className="space-y-4 p-4 pt-5">
      {/* HERO Drone Mapping Header */}
      <div className="relative overflow-hidden rounded-2xl bg-hero p-4 pb-3">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-primary-glow animate-pulse" />
          <div className="absolute top-8 right-12 w-1 h-1 rounded-full bg-accent" />
          <div className="absolute top-12 right-2 w-1.5 h-1.5 rounded-full bg-primary-glow" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary-glow mb-1">SENT AI</p>
            <h1 className="text-xl font-heading font-bold text-white leading-tight">Drone Mapping</h1>
            <p className="text-[10px] text-white/60 mt-0.5">Didukung teknologi kecerdasan buatan</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8 text-primary-glow hover:bg-white/10">
                <ShieldCheck className="w-4 h-4" />
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${droneOnline > 0 ? 'bg-success' : 'bg-success/60'}`} />
            <span className="text-[11px] text-white/85">
              {droneOnline > 0 ? `${droneOnline} drone aktif` : "Tidak ada drone aktif"}
            </span>
          </div>
          <span className="text-[11px] text-white/70">{droneOnline} Drone Online</span>
        </div>
      </div>

      {/* Aksi cepat */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Aksi cepat</p>
          <Link to="/account" className="text-[11px] text-primary flex items-center gap-0.5">
            Periksa drone saya <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            className="h-11 text-xs font-semibold rounded-xl bg-primary/90 hover:bg-primary"
            onClick={handleOpenClaimDialog}
            disabled={claimableInvestments.length === 0}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Mulai Misi
          </Button>
          <Button
            variant="secondary"
            className="h-11 text-xs font-semibold rounded-xl bg-secondary/80 hover:bg-secondary"
            onClick={() => navigate("/product")}
          >
            Sewa drone
          </Button>
        </div>
      </div>

      {/* Marquee bar */}
      <div className="flex items-center gap-2 rounded-xl bg-card/70 border border-border/50 px-3 py-2 overflow-hidden">
        <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-[10px] text-muted-foreground truncate">
          Selesaikan misi harian untuk mendapatkan keberuntungan ekstra. Pertahankan drone aktif setiap hari.
        </p>
      </div>

      {/* Progress Penerbangan */}
      <Card className="border-primary/25 bg-card/80 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Progress Penerbangan</p>
                <p className="text-[10px] text-muted-foreground">Terbang setiap hari untuk hadiah</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/40 text-primary">
              Level drone: VIP {vipLevel}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Pendapatan harian aktif</span>
            <span className="text-sm font-bold text-primary break-all">{formatCurrency(totalDailyIncome)}</span>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-primary transition-all"
              style={{ width: `${Math.min((droneOnline / 5) * 100, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {droneOnline > 0 ? `Anda sudah aktif bersama kami ${droneOnline} drone` : 'Belum ada drone aktif hari ini'}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] text-primary hover:text-primary px-2 rounded-full bg-primary/10 hover:bg-primary/20"
              onClick={() => navigate("/product")}
            >
              Lebih banyak <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Eksklusif untuk Anda — 3 cards */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Eksklusif untuk Anda</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate("/account")}
            className="rounded-xl bg-card/80 border border-border/50 hover:border-primary/40 p-3 text-left transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-primary-glow" />
            </div>
            <p className="text-[11px] font-semibold text-foreground">Tantangan</p>
          </button>
          <button
            onClick={() => navigate("/team")}
            className="rounded-xl bg-card/80 border border-border/50 hover:border-primary/40 p-3 text-left transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center mb-2">
              <Repeat className="w-5 h-5 text-accent" />
            </div>
            <p className="text-[11px] font-semibold text-foreground">Menukarkan</p>
          </button>
          <button
            onClick={() => setCheckinOpen(true)}
            className="rounded-xl bg-card/80 border border-border/50 hover:border-primary/40 p-3 text-left transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-vip-gold/30 to-primary/20 flex items-center justify-center mb-2">
              <Gift className="w-5 h-5 text-vip-gold" />
            </div>
            <p className="text-[11px] font-semibold text-foreground">Keberuntungan</p>
          </button>
        </div>
      </div>

      {/* Insight AI */}
      <Card className="border-primary/25 bg-gradient-to-br from-primary/10 to-card/80">
        <CardContent className="p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            <p className="text-xs font-semibold text-foreground">Insight AI</p>
          </div>
          <p className="text-[11px] text-foreground/80 mb-1">
            {droneOnline > 0
              ? `Efisiensi pemetaan meningkat ${Math.min(droneOnline * 4, 24)}% dibanding kemarin`
              : "Aktifkan drone untuk mulai pemetaan"}
          </p>
          <p className="text-[10px] text-muted-foreground">Tidak ada gangguan • Sistem berjalan normal</p>
        </CardContent>
      </Card>

      {/* Daily Check-in compact */}
      <Card
        className="border-border/50 bg-card/80 cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => setCheckinOpen(true)}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Check-in Harian</p>
            <p className="text-[10px] text-muted-foreground">Absen setiap hari, dapat hadiah</p>
          </div>
          <Button size="sm" className="h-7 text-[11px] rounded-full px-3" onClick={(e) => { e.stopPropagation(); setCheckinOpen(true); }}>
            Check-in
          </Button>
        </CardContent>
      </Card>

      {/* Claim banner if available */}
      {claimableInvestments.length > 0 && (
        <Card
          className="border-success/30 bg-card/80 cursor-pointer hover:border-success/50 transition-colors"
          onClick={handleOpenClaimDialog}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Klaim Pendapatan Hari Ini</p>
              <p className="text-[10px] text-muted-foreground">{claimableInvestments.length} drone siap diklaim</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-success break-all">+{formatCurrency(totalClaimable)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} onSuccess={loadData} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={balance} onSuccess={loadData} />
      <DailyCheckinDialog open={checkinOpen} onOpenChange={setCheckinOpen} onSuccess={loadData} />
      <InvestDialog open={investOpen} onOpenChange={setInvestOpen} product={selectedProduct} balance={balance} onSuccess={loadData} />

      {/* Claim All Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-sm border-success/30">
          <DialogHeader>
            <DialogTitle className="text-center text-base font-heading">
              {claimed ? "🎉 Selamat!" : "Klaim Pendapatan Drone"}
            </DialogTitle>
          </DialogHeader>

          <div className="relative py-4">
            {showConfetti && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${1 + Math.random() * 1}s`
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
                {claimed ? <PartyPopper className="w-10 h-10 text-primary-foreground" /> : <Gift className="w-10 h-10 text-primary-foreground" />}
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">{claimableInvestments.length} drone aktif</p>
                <p className="text-2xl font-bold text-foreground break-all">
                  {claimed ? '+' : ''}{formatCurrency(totalClaimable)}
                </p>
                {claimed && <p className="text-xs text-success">Berhasil ditambahkan ke saldo!</p>}
              </div>
            </div>
          </div>

          {!claimed && (
            <Button
              onClick={handleClaimAll}
              disabled={isClaiming}
              className="w-full h-11 text-sm font-semibold"
            >
              <Coins className="w-4 h-4 mr-2" />
              {isClaiming ? 'Memproses...' : claimableInvestments.length > 1 ? 'Klaim Semua Sekarang' : 'Klaim Sekarang'}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
