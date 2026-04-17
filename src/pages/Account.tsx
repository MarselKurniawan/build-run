import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
  Gift,
  Package,
  Sparkles,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getTransactions, getInvestments, updateInvestment, updateProfile, createTransaction, formatCurrency, canClaimToday, processReferralRabat, Transaction, Investment } from "@/lib/database";
import ClaimRewardDialog from "@/components/ClaimRewardDialog";

const Account = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const refreshData = async () => {
    if (user) {
      const [txData, invData] = await Promise.all([
        getTransactions(user.id),
        getInvestments(user.id)
      ]);
      setTransactions(txData);
      setInvestments(invData);
      await refreshProfile();
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const monitoringData = {
    totalIncome: profile?.total_income || 0,
    totalRecharge: profile?.total_recharge || 0,
    totalWithdraw: profile?.total_withdraw || 0,
    teamIncome: profile?.team_income || 0,
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "recharge":
        return <ArrowUpRight className="w-4 h-4 text-success" />;
      case "withdraw":
        return <ArrowDownRight className="w-4 h-4 text-accent" />;
      case "income":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "commission":
        return <Users className="w-4 h-4 text-primary" />;
      case "rabat":
        return <Users className="w-4 h-4 text-vip-gold" />;
      case "invest":
        return <Package className="w-4 h-4 text-primary" />;
      default:
        return <Wallet className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      recharge: "Isi Ulang",
      withdraw: "Tarik",
      invest: "Sewa Drone",
      income: "Pendapatan Harian",
      commission: "Komisi Tim",
      rabat: "Rabat Harian",
    };
    return labels[type] || type;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const activeInvestments = investments.filter(i => i.status === 'active');

  const handleOpenClaimDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setClaimDialogOpen(true);
  };

  const handleClaim = async () => {
    if (!selectedInvestment || !user || !profile) return;
    
    try {
      // Update investment
      const newTotalEarned = selectedInvestment.total_earned + selectedInvestment.daily_income;
      const newDaysRemaining = selectedInvestment.days_remaining - 1;
      
      await updateInvestment(selectedInvestment.id, {
        total_earned: newTotalEarned,
        days_remaining: newDaysRemaining,
        last_claimed_at: new Date().toISOString(),
        status: newDaysRemaining <= 0 ? 'completed' : 'active'
      });

      // Update profile balance and total income
      await updateProfile(user.id, {
        balance: profile.balance + selectedInvestment.daily_income,
        total_income: profile.total_income + selectedInvestment.daily_income
      });

      // Create transaction record
      await createTransaction({
        user_id: user.id,
        type: 'income',
        amount: selectedInvestment.daily_income,
        status: 'success',
        description: `Income harian dari ${selectedInvestment.product_name}`
      });

      // Process referral rabat for upline (rabat on daily profit)
      await processReferralRabat(user.id, selectedInvestment.daily_income);

      await refreshData();

      // Show success notification
      toast({
        title: "🎉 Klaim Berhasil!",
        description: `Anda mendapatkan ${formatCurrency(selectedInvestment.daily_income)} dari ${selectedInvestment.product_name}`,
      });
    } catch (error) {
      console.error('Error claiming income:', error);
      toast({
        title: "Gagal Klaim",
        description: "Terjadi kesalahan saat mengklaim penghasilan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  // Count claimable investments
  const claimableInvestments = activeInvestments.filter(inv => canClaimToday(inv.last_claimed_at));
  const totalClaimable = claimableInvestments.reduce((sum, inv) => sum + inv.daily_income, 0);

  return (
    <div className="space-y-4 p-4 pt-5">
      {/* Claimable Notification Banner */}
      {claimableInvestments.length > 0 && (
        <div className="rounded-xl bg-card/80 border border-success/30 p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success/15 rounded-lg flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {claimableInvestments.length} Drone Siap Diklaim
              </p>
              <p className="text-[10px] text-muted-foreground break-all">
                Total: <span className="font-bold text-success">{formatCurrency(totalClaimable)}</span>
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-success" />
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-base font-heading font-bold text-foreground mb-0.5">Drone Saya</h1>
        <p className="text-[11px] text-muted-foreground">Monitor aktivitas dan pendapatan Anda</p>
      </div>

      {/* Monitoring Dashboard */}
      <div>
        <h2 className="text-xs font-heading font-bold text-foreground mb-2">Statistik</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="bg-card/80 border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <p className="text-[10px] font-medium text-muted-foreground">Total Pendapatan</p>
              </div>
              <p className="text-sm font-bold text-success break-all">{formatCurrency(monitoringData.totalIncome)}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                <p className="text-[10px] font-medium text-muted-foreground">Total Isi Ulang</p>
              </div>
              <p className="text-sm font-bold text-foreground break-all">
                {formatCurrency(monitoringData.totalRecharge)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-accent" />
                <p className="text-[10px] font-medium text-muted-foreground">Total Tarik</p>
              </div>
              <p className="text-sm font-bold text-foreground break-all">
                {formatCurrency(monitoringData.totalWithdraw)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-medium text-muted-foreground">Komisi Tim</p>
              </div>
              <p className="text-sm font-bold text-primary break-all">{formatCurrency(monitoringData.teamIncome)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Drones */}
      {activeInvestments.length > 0 && (
        <Card className="bg-card/80 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              Alat milik saya ({activeInvestments.length}/{activeInvestments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activeInvestments.map((inv) => {
              const canClaim = canClaimToday(inv.last_claimed_at);
              return (
                <div key={inv.id} className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">Drone {inv.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Melayani {inv.days_remaining} hari lagi
                      </p>
                    </div>
                    <Badge variant="success" className="text-[9px] h-4 px-1.5">Aktif</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/50">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Sewa</p>
                      <p className="text-[11px] font-semibold break-all">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Harian</p>
                      <p className="text-[11px] font-semibold text-success break-all">{formatCurrency(inv.daily_income)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Diperoleh</p>
                      <p className="text-[11px] font-semibold text-accent break-all">{formatCurrency(inv.total_earned)}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-border/50">
                    {canClaim ? (
                      <Button
                        onClick={() => handleOpenClaimDialog(inv)}
                        className="w-full h-9 text-xs font-semibold"
                      >
                        <Gift className="w-3.5 h-3.5 mr-1.5" />
                        Klaim {formatCurrency(inv.daily_income)}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full h-9 text-xs"
                      >
                        Sudah Diklaim Hari Ini
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {activeInvestments.length === 0 && (
        <Card className="bg-card/80 border-border/60">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-semibold text-foreground">Alat milik saya (0/0)</p>
            <p className="text-[10px] text-muted-foreground mt-1">Belum ada drone aktif. Sewa drone untuk mulai pemetaan!</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
              <TabsTrigger value="recharge" className="text-xs">Recharge</TabsTrigger>
              <TabsTrigger value="withdraw" className="text-xs">Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada transaksi</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {getTransactionLabel(transaction.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          transaction.type === 'recharge' || transaction.type === 'income' || transaction.type === 'commission' || transaction.type === 'rabat' ? "text-success" : "text-foreground"
                        }`}
                      >
                        {transaction.type === 'recharge' || transaction.type === 'income' || transaction.type === 'commission' || transaction.type === 'rabat' ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge
                        variant={getStatusVariant(transaction.status) as any}
                        className="text-xs capitalize"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="recharge" className="space-y-2">
              {transactions.filter((t) => t.type === "recharge").length === 0 ? (
                <div className="text-center py-8">
                  <ArrowUpRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada recharge</p>
                </div>
              ) : (
                transactions
                  .filter((t) => t.type === "recharge")
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success">
                          +{formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={getStatusVariant(transaction.status) as any}
                          className="text-xs capitalize"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-2">
              {transactions.filter((t) => t.type === "withdraw").length === 0 ? (
                <div className="text-center py-8">
                  <ArrowDownRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada withdraw</p>
                </div>
              ) : (
                transactions
                  .filter((t) => t.type === "withdraw")
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          -{formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={getStatusVariant(transaction.status) as any}
                          className="text-xs capitalize"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Claim Reward Dialog */}
      <ClaimRewardDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        amount={selectedInvestment?.daily_income || 0}
        productName={selectedInvestment?.product_name || ""}
        onClaim={handleClaim}
      />
    </div>
  );
};

export default Account;
