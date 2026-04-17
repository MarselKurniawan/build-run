import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, TrendingUp, Shield, Users, Sparkles, Zap, Phone, Mail, Loader2 } from "lucide-react";
import { z } from "zod";
import ForgotPasswordFlow from "@/components/ForgotPasswordFlow";

// DEV MODE: skip OTP sementara (UI OTP tetep ada tapi auto-pass).
// Set ke false untuk aktifin verifikasi OTP normal.
const DEV_SKIP_OTP = true;

const phoneSchema = z.string().min(10, "Nomor WhatsApp minimal 10 digit").regex(/^[0-9+]+$/, "Format nomor tidak valid");
const passwordSchema = z.string().min(6, "Password minimal 6 karakter");
const emailSchema = z.string().email("Format email tidak valid").optional().or(z.literal(""));

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // OTP verification state
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      phoneSchema.parse(loginPhone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginPhone, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Login Gagal",
        description: error.message === "Invalid login credentials" 
          ? "Nomor WhatsApp atau password salah" 
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login Berhasil!",
      description: "Selamat datang kembali di InvestPro",
    });
    navigate("/");
  };

  const handleSendOtp = async () => {
    try {
      phoneSchema.parse(registerPhone);
      passwordSchema.parse(registerPassword);
      if (registerEmail) emailSchema.parse(registerEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Error", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }
    if (!registerName.trim()) {
      toast({ title: "Error", description: "Nama harus diisi", variant: "destructive" });
      return;
    }

    setOtpSending(true);
    try {
      if (DEV_SKIP_OTP) {
        // Dev mode: skip kirim OTP, langsung lanjut ke step OTP dengan kode auto-fill
        toast({ title: "Mode Dev: OTP di-skip", description: "Klik 'Verifikasi & Daftar' untuk lanjut" });
        setOtpCode("000000");
        setOtpStep('otp');
        setOtpCountdown(0);
        setOtpSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: registerPhone },
      });

      if (error || !data?.success) {
        toast({
          title: "Gagal Kirim OTP",
          description: data?.error || error?.message || "Gagal mengirim kode OTP",
          variant: "destructive",
        });
        setOtpSending(false);
        return;
      }

      toast({ title: "OTP Terkirim!", description: "Cek WhatsApp Anda untuk kode verifikasi" });
      setOtpStep('otp');
      setOtpCountdown(60);
    } catch (err) {
      toast({ title: "Error", description: "Gagal mengirim OTP", variant: "destructive" });
    }
    setOtpSending(false);
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      toast({ title: "Error", description: "Masukkan 6 digit kode OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP
      const { data, error: verifyError } = await supabase.functions.invoke("verify-otp", {
        body: { phone: registerPhone, code: otpCode },
      });

      if (verifyError || !data?.success) {
        toast({
          title: "Verifikasi Gagal",
          description: data?.error || "Kode OTP salah atau kadaluarsa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // OTP verified, proceed with registration
      const { error } = await signUp(registerPhone, registerPassword, registerName, referralCode || undefined, registerEmail || undefined);

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes("already registered")) {
          errorMessage = "Nomor sudah terdaftar. Silakan login.";
        }
        toast({ title: "Registrasi Gagal", description: errorMessage, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      toast({ title: "Registrasi Berhasil!", description: "Akun Anda telah dibuat. Selamat berinvestasi!" });
      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" });
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-12 flex-col justify-between relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-4xl font-bold text-foreground">
              InvestPro
            </h1>
          </div>
          <p className="text-muted-foreground">Platform Investasi Terpercaya</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">Return Tinggi</h3>
              <p className="text-muted-foreground text-sm">Dapatkan keuntungan hingga 10% per hari</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">Aman & Terpercaya</h3>
              <p className="text-muted-foreground text-sm">Dilindungi sistem keamanan berlapis</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">Bonus Referral</h3>
              <p className="text-muted-foreground text-sm">Ajak teman dan dapatkan komisi hingga 10%</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-muted-foreground text-sm">© 2024 InvestPro. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-7 h-7 text-primary" />
              <h1 className="font-heading text-3xl font-bold text-foreground">InvestPro</h1>
            </div>
            <p className="text-muted-foreground text-sm">Platform Investasi Terpercaya</p>
          </div>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-heading flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Selamat Datang
              </CardTitle>
              <CardDescription>Masuk atau daftar untuk mulai berinvestasi</CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <ForgotPasswordFlow onBack={() => setShowForgotPassword(false)} />
              ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="register">Daftar</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Nomor WhatsApp
                      </Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="08123456789"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        required
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Masukkan password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="bg-muted/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? "Memproses..." : "Masuk"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Lupa Password?
                      </button>
                    </div>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  {otpStep === 'form' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nama Lengkap</Label>
                        <Input id="register-name" type="text" placeholder="Masukkan nama lengkap" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required className="bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-phone" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Nomor WhatsApp</Label>
                        <Input id="register-phone" type="tel" placeholder="08123456789" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} required className="bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email <span className="text-muted-foreground text-xs">(Opsional)</span></Label>
                        <Input id="register-email" type="email" placeholder="nama@email.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Input id="register-password" type={showPassword ? "text" : "password"} placeholder="Minimal 6 karakter" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength={6} className="bg-muted/50" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
                        <Input id="register-confirm-password" type="password" placeholder="Ulangi password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required className="bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral-code">Kode Referral <span className="text-muted-foreground">(Opsional)</span></Label>
                        <Input id="referral-code" type="text" placeholder="Masukkan kode referral" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="bg-muted/50" />
                      </div>
                      <Button type="button" className="w-full" size="lg" disabled={otpSending} onClick={handleSendOtp}>
                        {otpSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim OTP...</> : "Kirim Kode Verifikasi"}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                      <div className="text-center space-y-2 mb-4">
                        <Phone className="w-10 h-10 text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Kode OTP telah dikirim ke <span className="font-semibold text-foreground">{registerPhone}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otp-code">Kode Verifikasi (6 digit)</Label>
                        <Input
                          id="otp-code"
                          type="text"
                          placeholder="Masukkan 6 digit kode"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          className="bg-muted/50 text-center text-2xl tracking-widest font-mono"
                          autoFocus
                        />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memverifikasi...</> : "Verifikasi & Daftar"}
                      </Button>
                      <div className="flex items-center justify-between text-sm">
                        <button type="button" onClick={() => { setOtpStep('form'); setOtpCode(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
                          ← Kembali
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpCountdown > 0 || otpSending}
                          className="text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground"
                        >
                          {otpCountdown > 0 ? `Kirim ulang (${otpCountdown}s)` : "Kirim ulang OTP"}
                        </button>
                      </div>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
