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
      recharge: "Recharge",
      withdraw: "Withdraw",
      invest: "Investasi",
      income: "Penghasilan Harian",
      commission: "Komisi Referral",
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
    <div className="space-y-6 p-4 pt-6">
      {/* Claimable Notification Banner */}
      {claimableInvestments.length > 0 && (
        <div className="bg-gradient-to-r from-success/20 via-primary/20 to-success/20 border border-success/30 rounded-xl p-4 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {claimableInvestments.length} Investasi Siap Diklaim!
              </p>
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-success">{formatCurrency(totalClaimable)}</span>
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-success animate-bounce" />
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-heading font-bold text-foreground mb-1">Akun Saya</h1>
        <p className="text-[11px] text-muted-foreground">Monitor aktivitas dan performa Anda</p>
      </div>

      {/* Monitoring Dashboard */}
      <div>
        <h2 className="text-sm font-heading font-bold text-foreground mb-3">Monitoring</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-card bg-gradient-to-br from-success/20 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-xs font-medium text-muted-foreground">Total Income</p>
              </div>
              <p className="text-sm font-bold text-success">{formatCurrency(monitoringData.totalIncome)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-success" />
                <p className="text-xs font-medium text-muted-foreground">Total Recharge</p>
              </div>
              <p className="text-sm font-bold text-foreground break-all">
                {formatCurrency(monitoringData.totalRecharge)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-accent" />
                <p className="text-xs font-medium text-muted-foreground">Total Withdraw</p>
              </div>
              <p className="text-sm font-bold text-foreground break-all">
                {formatCurrency(monitoringData.totalWithdraw)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Team Income</p>
              </div>
              <p className="text-sm font-bold text-primary">{formatCurrency(monitoringData.teamIncome)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Investasi Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeInvestments.map((inv) => {
              const canClaim = canClaimToday(inv.last_claimed_at);
              return (
                <div key={inv.id} className="bg-muted rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{inv.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.days_remaining} hari tersisa
                      </p>
                    </div>
                    <Badge variant="success" className="text-xs">Aktif</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Investasi</p>
                      <p className="text-sm font-semibold">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Harian</p>
                      <p className="text-sm font-semibold text-success">{formatCurrency(inv.daily_income)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="text-sm font-semibold text-accent">{formatCurrency(inv.total_earned)}</p>
                    </div>
                  </div>
                  {/* Claim Button */}
                  <div className="mt-3 pt-3 border-t border-border">
                    {canClaim ? (
                      <Button
                        onClick={() => handleOpenClaimDialog(inv)}
                        className="w-full bg-gradient-to-r from-success to-primary hover:from-success/90 hover:to-primary/90 text-primary-foreground font-semibold h-12"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Claim {formatCurrency(inv.daily_income)}
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                      >
                        <Gift className="w-4 h-4 mr-2" />
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
