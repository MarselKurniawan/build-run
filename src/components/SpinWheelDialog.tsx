import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, updateProfile, createTransaction } from "@/lib/database";
import { Sparkles, Gift, Ticket } from "lucide-react";

interface SpinWheelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// 8 segments — angka dipilih random secara fair (uniform)
const REWARDS = [
  { label: "Rp 5K", amount: 5000, color: "from-blue-500 to-blue-600" },
  { label: "Rp 10K", amount: 10000, color: "from-cyan-500 to-cyan-600" },
  { label: "Rp 25K", amount: 25000, color: "from-sky-500 to-sky-600" },
  { label: "Rp 50K", amount: 50000, color: "from-indigo-500 to-indigo-600" },
  { label: "Rp 100K", amount: 100000, color: "from-blue-600 to-indigo-700" },
  { label: "Rp 250K", amount: 250000, color: "from-violet-500 to-blue-700" },
  { label: "Rp 500K", amount: 500000, color: "from-amber-500 to-amber-600" },
  { label: "Rp 1JT", amount: 1000000, color: "from-yellow-400 to-amber-500" },
];

const SEGMENT_DEG = 360 / REWARDS.length;

const SpinWheelDialog = ({ open, onOpenChange, onSuccess }: SpinWheelDialogProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<{ id: string }[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultIdx, setResultIdx] = useState<number | null>(null);

  const loadTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("spin_tickets")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_used", false);
    setTickets(data || []);
  };

  useEffect(() => {
    if (open) {
      loadTickets();
      setResultIdx(null);
    }
  }, [open, user]);

  const handleSpin = async () => {
    if (!user || !profile || tickets.length === 0 || spinning) return;
    setSpinning(true);
    setResultIdx(null);

    const ticket = tickets[0];
    // Pilih hadiah random (weighted: lebih sering hadiah kecil)
    const weights = [25, 20, 18, 14, 10, 7, 4, 2];
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) { idx = i; break; }
    }

    // Hitung rotasi: minimal 6 putaran + posisi target
    const targetDeg = 360 - (idx * SEGMENT_DEG + SEGMENT_DEG / 2);
    const finalRotation = rotation + 360 * 6 + targetDeg - (rotation % 360);
    setRotation(finalRotation);

    setTimeout(async () => {
      const reward = REWARDS[idx].amount;
      try {
        // Tandai tiket terpakai
        await supabase
          .from("spin_tickets")
          .update({ is_used: true, used_at: new Date().toISOString(), reward_amount: reward })
          .eq("id", ticket.id);

        // Tambah saldo
        await updateProfile(user.id, {
          balance: (profile.balance || 0) + reward,
          total_income: (profile.total_income || 0) + reward,
        });

        await createTransaction({
          user_id: user.id,
          type: "spin_reward",
          amount: reward,
          status: "success",
          description: `Hadiah Roda Keberuntungan ${REWARDS[idx].label}`,
        });

        setResultIdx(idx);
        await loadTickets();
        onSuccess();
        toast({
          title: "🎉 Selamat!",
          description: `Anda mendapatkan ${formatCurrency(reward)}`,
        });
      } catch (err) {
        toast({ title: "Gagal", description: "Gagal memproses spin", variant: "destructive" });
      } finally {
        setSpinning(false);
      }
    }, 4200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !spinning && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" /> Roda Keberuntungan
          </DialogTitle>
          <DialogDescription className="text-xs">
            Putar untuk dapat hadiah! Setiap referral berhasil = 1 putaran gratis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between bg-card/60 border border-border/60 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Tiket Tersedia</span>
          </div>
          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
            {tickets.length}
          </Badge>
        </div>

        {/* Wheel */}
        <div className="relative mx-auto w-64 h-64 my-2">
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-primary drop-shadow" />
          </div>

          <div
            className="w-full h-full rounded-full border-4 border-primary/40 overflow-hidden relative shadow-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.16, 0.99)" : "none",
              background: `conic-gradient(${REWARDS.map((_, i) => {
                const colors = ["#3b82f6", "#06b6d4", "#0ea5e9", "#6366f1", "#2563eb", "#7c3aed", "#f59e0b", "#fbbf24"];
                const start = (i * 360) / REWARDS.length;
                const end = ((i + 1) * 360) / REWARDS.length;
                return `${colors[i]} ${start}deg ${end}deg`;
              }).join(", ")})`,
            }}
          >
            {REWARDS.map((rw, i) => {
              const angle = i * SEGMENT_DEG + SEGMENT_DEG / 2;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-bottom-left text-white text-[10px] font-bold"
                  style={{
                    transform: `rotate(${angle}deg) translate(0, -90px)`,
                  }}
                >
                  {rw.label}
                </div>
              );
            })}
          </div>

          {/* Center */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center z-10">
            <Gift className="w-5 h-5 text-primary" />
          </div>
        </div>

        {resultIdx !== null && !spinning && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Anda mendapatkan</p>
            <p className="text-xl font-bold text-success break-all">
              {formatCurrency(REWARDS[resultIdx].amount)}
            </p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSpin}
          disabled={spinning || tickets.length === 0}
        >
          {spinning ? "Memutar..." : tickets.length === 0 ? "Tidak Ada Tiket" : "PUTAR SEKARANG"}
        </Button>

        {tickets.length === 0 && (
          <p className="text-[10px] text-center text-muted-foreground">
            Undang teman lewat kode referral untuk dapat tiket spin gratis!
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpinWheelDialog;
