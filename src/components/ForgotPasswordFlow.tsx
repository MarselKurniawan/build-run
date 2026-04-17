import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Lock, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

// DEV MODE: skip OTP sementara — sinkron dengan flag di Auth.tsx
const DEV_SKIP_OTP = true;
const DEV_BYPASS_CODE = "DEV_SKIP_OTP_BYPASS";

type Step = "phone" | "otp" | "newPassword" | "success";

interface ForgotPasswordFlowProps {
  onBack: () => void;
}

const ForgotPasswordFlow = ({ onBack }: ForgotPasswordFlowProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Error", description: "Masukkan nomor WhatsApp yang valid", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (DEV_SKIP_OTP) {
        toast({ title: "Mode Dev: OTP di-skip", description: "Lanjut langsung set password baru" });
        setOtpCode(DEV_BYPASS_CODE);
        setStep("otp");
        setOtpCountdown(0);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });

      if (error || !data?.success) {
        toast({
          title: "Gagal Kirim OTP",
          description: data?.error || error?.message || "Gagal mengirim kode OTP",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({ title: "OTP Terkirim!", description: "Cek WhatsApp Anda untuk kode verifikasi" });
      setStep("otp");
      setOtpCountdown(60);
    } catch {
      toast({ title: "Error", description: "Gagal mengirim OTP", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = () => {
    if (DEV_SKIP_OTP) {
      // Dev: skip verifikasi, langsung lanjut
      setStep("newPassword");
      return;
    }
    if (otpCode.length !== 6) {
      toast({ title: "Error", description: "Masukkan 6 digit kode OTP", variant: "destructive" });
      return;
    }
    setStep("newPassword");
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { phone, code: otpCode, newPassword },
      });

      if (error || !data?.success) {
        toast({
          title: "Gagal Reset Password",
          description: data?.error || error?.message || "Terjadi kesalahan",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStep("success");
    } catch {
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" });
    }
    setIsLoading(false);
  };

  if (step === "success") {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="w-14 h-14 text-primary mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">Password Berhasil Diubah!</h3>
        <p className="text-sm text-muted-foreground">Silakan login dengan password baru Anda.</p>
        <Button onClick={onBack} className="w-full" size="lg">
          Kembali ke Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={step === "phone" ? onBack : () => setStep(step === "newPassword" ? "otp" : "phone")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="text-center space-y-1 mb-2">
        <h3 className="text-lg font-semibold text-foreground">Lupa Password</h3>
        <p className="text-sm text-muted-foreground">
          {step === "phone" && "Masukkan nomor WhatsApp terdaftar Anda"}
          {step === "otp" && "Masukkan kode OTP yang dikirim ke WhatsApp"}
          {step === "newPassword" && "Buat password baru Anda"}
        </p>
      </div>

      {step === "phone" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="forgot-phone" className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp
            </Label>
            <Input
              id="forgot-phone"
              type="tel"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <Button onClick={handleSendOtp} className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : "Kirim Kode OTP"}
          </Button>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="text-center mb-2">
            <Phone className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Kode dikirim ke <span className="font-semibold text-foreground">{phone}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="forgot-otp">Kode Verifikasi (6 digit)</Label>
            <Input
              id="forgot-otp"
              type="text"
              placeholder="Masukkan 6 digit kode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="bg-muted/50 text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>
          <Button onClick={handleVerifyOtp} className="w-full" size="lg">
            Verifikasi
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpCountdown > 0 || isLoading}
              className="text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground"
            >
              {otpCountdown > 0 ? `Kirim ulang (${otpCountdown}s)` : "Kirim ulang OTP"}
            </button>
          </div>
        </>
      )}

      {step === "newPassword" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password Baru
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted/50"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm-new-password"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <Button onClick={handleResetPassword} className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : "Ubah Password"}
          </Button>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordFlow;
