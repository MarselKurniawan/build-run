import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  getVipSettings,
  updateVipSetting,
  Profile,
  Transaction,
  Coupon,
  VipSetting,
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
  Crown,
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
  const [vipDialogOpen, setVipDialogOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [vipSettings, setVipSettings] = useState<VipSetting[]>([]);
  const [editingVip, setEditingVip] = useState<Record<number, number>>({});
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
      case "success": return <Badge className="bg-success/15 text-success border-0 text-[10px] font-medium">Sukses</Badge>;
      case "pending": return <Badge className="bg-secondary/15 text-secondary border-0 text-[10px] font-medium">Pending</Badge>;
      case "rejected": return <Badge className="bg-destructive/15 text-destructive border-0 text-[10px] font-medium">Ditolak</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      withdraw: "bg-destructive/10 text-destructive",
      recharge: "bg-success/10 text-success",
      income: "bg-primary/10 text-primary",
      invest: "bg-secondary/10 text-secondary",
    };
    return <Badge className={`${map[type] || "bg-muted text-muted-foreground"} border-0 text-[10px] font-medium capitalize`}>{type}</Badge>;
  };

  const StatCard = ({ icon: Icon, label, value, color = "text-foreground" }: { icon: any; label: string; value: string | number; color?: string }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
          <p className={`text-[10px] sm:text-xs font-bold ${color} whitespace-nowrap`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  const TransactionTable = ({ data, showActions }: { data: PendingTx[]; showActions?: boolean }) => (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="text-[10px] font-semibold w-[140px]">Member</TableHead>
            <TableHead className="text-[10px] font-semibold w-[70px]">Tipe</TableHead>
            <TableHead className="text-[10px] font-semibold text-right w-[110px]">Jumlah</TableHead>
            <TableHead className="text-[10px] font-semibold w-[70px]">Status</TableHead>
            <TableHead className="text-[10px] font-semibold w-[90px]">Tanggal</TableHead>
            {showActions && <TableHead className="text-[10px] font-semibold text-center w-[130px]">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground text-xs">
                Tidak ada transaksi
              </TableCell>
            </TableRow>
          ) : (
            data.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-muted/20">
                <TableCell className="py-2">
                  <p className="text-xs font-medium truncate">{tx.userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{tx.userPhone || tx.userEmail}</p>
                </TableCell>
                <TableCell className="py-2">{getTypeBadge(tx.type)}</TableCell>
                <TableCell className="py-2 text-right">
                  <span className={`text-xs font-bold ${
                    tx.type === "recharge" || tx.type === "income" ? "text-success" : 
                    tx.type === "withdraw" ? "text-destructive" : "text-foreground"
                  }`}>
                    {tx.type === "recharge" || tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </TableCell>
                <TableCell className="py-2">{getStatusBadge(tx.status)}</TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">
                  {new Date(tx.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                </TableCell>
                {showActions && (
                  <TableCell className="py-2">
                    {tx.status === "pending" && (
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" className="h-6 px-2 text-[10px] bg-success hover:bg-success/90" onClick={() => handleApprove(tx)} disabled={isLoading === tx.id}>
                          <CheckCircle className="w-3 h-3 mr-0.5" />OK
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => handleReject(tx)} disabled={isLoading === tx.id}>
                          <XCircle className="w-3 h-3 mr-0.5" />No
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4 p-4 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground leading-tight">Dashboard Admin</h1>
            <p className="text-[10px] text-muted-foreground">Kelola member & transaksi</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBackupDialogOpen(true)} title="Backup">
            <Database className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCouponDialogOpen(true)} title="Kupon">
            <Ticket className="w-3.5 h-3.5" />
          </Button>
          <Link to="/admin/products">
            <Button variant="outline" size="icon" className="h-8 w-8" title="Produk">
              <Package className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="default" size="icon" className="h-8 w-8" title="Users">
              <UserCog className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards - 2 sections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={Users} label="Total Member" value={stats.totalUsers} color="text-primary" />
        <StatCard icon={UserPlus} label="Daftar Saja" value={stats.membersOnly} color="text-muted-foreground" />
        <StatCard icon={DollarSign} label="Member Deposit" value={stats.membersDeposit} color="text-success" />
        <StatCard icon={Clock} label="Pending TX" value={stats.pendingCount} color="text-accent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard icon={Wallet} label="Total Balance" value={formatCurrency(stats.totalBalance)} color="text-foreground" />
        <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(stats.totalIncome)} color="text-primary" />
        <StatCard icon={ArrowUpRight} label="Total Recharge" value={formatCurrency(stats.totalRecharge)} color="text-success" />
        <StatCard icon={ArrowDownRight} label="Total Withdraw" value={formatCurrency(stats.totalWithdraw)} color="text-destructive" />
      </div>

      {/* Transactions */}
      <Card>
        <Tabs defaultValue="pending">
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaksi</CardTitle>
              <TabsList className="h-8">
                <TabsTrigger value="pending" className="text-[10px] h-7 px-3">
                  Pending {pendingTransactions.length > 0 && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-accent text-accent-foreground border-0">{pendingTransactions.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-[10px] h-7 px-3">Semua</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <TabsContent value="pending" className="mt-0">
              <TransactionTable data={pendingTransactions} showActions />
            </TabsContent>
            <TabsContent value="history" className="mt-0 space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {["all", "withdraw", "recharge", "income", "invest"].map((filter) => (
                  <Button
                    key={filter}
                    variant={txFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTxFilter(filter)}
                    className="h-7 text-[10px] px-3 capitalize"
                  >
                    {filter === "all" ? "Semua" : filter}
                  </Button>
                ))}
              </div>
              <TransactionTable data={filteredTransactions} showActions />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

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

      <BackupDialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen} />
    </div>
  );
};

export default Admin;
