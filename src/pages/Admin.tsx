import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllProfiles,
  getPendingTransactions,
  getAllTransactions,
  updateTransactionStatus,
  updateProfile,
  getCoupons,
  createCoupon,
  deleteCoupon,
  formatCurrency,
  Profile,
  Transaction,
  Coupon,
} from "@/lib/database";
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Trash2,
  UserCog,
  Package,
  Ticket,
  Copy,
  Database,
  UserPlus,
  DollarSign,
  Clock,
  List,
} from "lucide-react";
import { Link } from "react-router-dom";
import BackupDialog from "@/components/BackupDialog";

interface PendingTx extends Transaction {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTx[]>([]);
  const [allTransactions, setAllTransactions] = useState<PendingTx[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [txFilter, setTxFilter] = useState<string>("all");

  const enrichTransactions = (txData: Transaction[], profilesData: Profile[]): PendingTx[] => {
    return txData.map(tx => {
      const profile = profilesData.find(p => p.user_id === tx.user_id);
      return {
        ...tx,
        userName: profile?.name || 'Unknown',
        userEmail: profile?.email || '',
        userPhone: profile?.phone || '',
      };
    });
  };

  const loadData = async () => {
    const [profilesData, txData, allTxData, couponData] = await Promise.all([
      getAllProfiles(),
      getPendingTransactions(),
      getAllTransactions(),
      getCoupons(),
    ]);
    setProfiles(profilesData);
    setPendingTransactions(enrichTransactions(txData, profilesData));
    setAllTransactions(enrichTransactions(allTxData, profilesData));
    setCoupons(couponData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateCoupon = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const result = await createCoupon(code);
    if (result) {
      toast({ title: "Kupon Dibuat", description: `Kode: ${code}` });
      loadData();
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await deleteCoupon(id);
    toast({ title: "Kupon Dihapus" });
    loadData();
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Disalin", description: `Kode ${code} disalin ke clipboard` });
  };

  const handleApprove = async (tx: PendingTx) => {
    setIsLoading(tx.id);
    await updateTransactionStatus(tx.id, "success");
    if (tx.type === 'withdraw') {
      const profile = profiles.find(p => p.user_id === tx.user_id);
      if (profile) {
        await updateProfile(tx.user_id, {
          total_withdraw: profile.total_withdraw + tx.amount
        });
      }
    }
    toast({ title: "Transaksi Disetujui", description: "Status berhasil diupdate" });
    setIsLoading(null);
    loadData();
  };

  const handleReject = async (tx: PendingTx) => {
    setIsLoading(tx.id);
    await updateTransactionStatus(tx.id, "rejected");
    if (tx.type === 'withdraw') {
      const profile = profiles.find(p => p.user_id === tx.user_id);
      if (profile) {
        await updateProfile(tx.user_id, {
          balance: profile.balance + tx.amount
        });
      }
    }
    toast({ title: "Transaksi Ditolak", description: "Balance dikembalikan", variant: "destructive" });
    setIsLoading(null);
    loadData();
  };

  const membersWithDeposit = profiles.filter(p => p.total_recharge > 0);
  const membersRegisteredOnly = profiles.filter(p => p.total_recharge === 0);

  const filteredTransactions = allTransactions.filter(tx => {
    if (txFilter === "all") return true;
    return tx.type === txFilter;
  });

  const stats = {
    totalUsers: profiles.length,
    totalBalance: profiles.reduce((sum, u) => sum + u.balance, 0),
    pendingCount: pendingTransactions.length,
    totalRecharge: profiles.reduce((sum, u) => sum + u.total_recharge, 0),
    totalWithdraw: profiles.reduce((sum, u) => sum + u.total_withdraw, 0),
    totalIncome: profiles.reduce((sum, u) => sum + u.total_income, 0),
    membersDeposit: membersWithDeposit.length,
    membersOnly: membersRegisteredOnly.length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-success/20 text-success border-success/30">Sukses</Badge>;
      case "pending": return <Badge variant="outline" className="text-accent border-accent/30">Pending</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Kelola pengguna dan transaksi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setBackupDialogOpen(true)}>
            <Database className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Backup</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCouponDialogOpen(true)}>
            <Ticket className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Kupon</span>
          </Button>
          <Link to="/admin/products">
            <Button variant="outline" size="sm">
              <Package className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Produk</span>
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="default" size="sm">
              <UserCog className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-4 h-4 shrink-0 text-primary" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Member</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <UserPlus className="w-4 h-4 shrink-0 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Daftar Saja</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{stats.membersOnly}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 shrink-0 text-success" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Member Deposit</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-success">{stats.membersDeposit}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden bg-accent/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 shrink-0 text-accent" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-accent">{stats.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-4 h-4 shrink-0 text-success" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Balance</p>
            </div>
            <p className="text-[10px] sm:text-lg font-bold break-all">{formatCurrency(stats.totalBalance)}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 shrink-0 text-primary" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Income</p>
            </div>
            <p className="text-[10px] sm:text-sm font-bold break-all">{formatCurrency(stats.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-4 h-4 shrink-0 text-success" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Recharge</p>
            </div>
            <p className="text-[10px] sm:text-sm font-bold break-all">{formatCurrency(stats.totalRecharge)}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="w-4 h-4 shrink-0 text-destructive" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Withdraw</p>
            </div>
            <p className="text-[10px] sm:text-sm font-bold break-all">{formatCurrency(stats.totalWithdraw)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-4 h-4" />
            Pending ({pendingTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <List className="w-4 h-4" />
            Semua Transaksi
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          {pendingTransactions.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Tidak ada transaksi pending</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingTransactions.map((tx) => (
                <Card key={tx.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "recharge" ? "bg-success/20" : "bg-accent/20"}`}>
                          {tx.type === "recharge" ? <ArrowUpRight className="w-5 h-5 text-success" /> : <ArrowDownRight className="w-5 h-5 text-accent" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tx.userName}</p>
                          <p className="text-xs text-muted-foreground">{tx.userPhone || tx.userEmail}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-accent">Pending</Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground capitalize">{tx.type}</span>
                        <span className={`text-lg font-bold ${tx.type === "recharge" ? "text-success" : "text-accent"}`}>
                          {tx.type === "recharge" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                      {tx.description && <p className="text-xs text-muted-foreground mt-1">{tx.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1 bg-success hover:bg-success/90" onClick={() => handleApprove(tx)} disabled={isLoading === tx.id}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleReject(tx)} disabled={isLoading === tx.id}>
                        <XCircle className="w-4 h-4 mr-1" />Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Transactions Tab */}
        <TabsContent value="history">
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", "withdraw", "recharge", "income", "invest"].map((filter) => (
              <Button
                key={filter}
                variant={txFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setTxFilter(filter)}
                className="capitalize"
              >
                {filter === "all" ? "Semua" : filter}
              </Button>
            ))}
          </div>

          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Tidak ada transaksi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <Card key={tx.id} className="shadow-card">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === "recharge" || tx.type === "income" ? "bg-success/20" : 
                          tx.type === "withdraw" ? "bg-destructive/20" : "bg-primary/20"
                        }`}>
                          {tx.type === "recharge" || tx.type === "income" ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : tx.type === "withdraw" ? (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{tx.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{tx.userPhone || tx.userEmail}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{tx.type} • {new Date(tx.created_at).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`font-bold text-sm ${
                          tx.type === "recharge" || tx.type === "income" ? "text-success" : 
                          tx.type === "withdraw" ? "text-destructive" : "text-foreground"
                        }`}>
                          {tx.type === "recharge" || tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                        <div className="mt-1">{getStatusBadge(tx.status)}</div>
                      </div>
                    </div>
                    {tx.description && (
                      <p className="text-[10px] text-muted-foreground mt-2 pl-12 truncate">{tx.description}</p>
                    )}
                    {/* Show approve/reject for pending transactions */}
                    {tx.status === "pending" && (
                      <div className="flex gap-2 mt-3 pl-12">
                        <Button variant="default" size="sm" className="flex-1 bg-success hover:bg-success/90 h-8 text-xs" onClick={() => handleApprove(tx)} disabled={isLoading === tx.id}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleReject(tx)} disabled={isLoading === tx.id}>
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" />Kelola Kupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={generateCoupon} className="w-full"><Ticket className="w-4 h-4 mr-2" />Generate Kupon Baru</Button>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {coupons.map((coupon) => (
                <div key={coupon.id} className={`flex items-center justify-between p-3 rounded-lg border ${coupon.is_used ? "bg-muted/50 opacity-60" : "bg-muted"}`}>
                  <div>
                    <p className="font-mono font-bold text-foreground">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {coupon.is_used ? `Digunakan - ${formatCurrency(coupon.reward_amount || 0)}` : "Belum digunakan"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!coupon.is_used && (
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(coupon.code)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCoupon(coupon.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <p className="text-center text-muted-foreground py-4">Belum ada kupon</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <BackupDialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen} />
    </div>
  );
};

export default Admin;
