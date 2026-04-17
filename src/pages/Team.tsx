import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Share2, Crown, Award, Copy, MessageCircle, Send, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, Profile } from "@/lib/database";
import { getMultiLevelTeam, MultiLevelTeam, COMMISSION_RATES, RABAT_RATES, VIP_THRESHOLDS } from "@/lib/teamUtils";
import { useToast } from "@/hooks/use-toast";

const Team = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<MultiLevelTeam>({ levelA: [], levelB: [], levelC: [], total: 0 });
  const [activeTab, setActiveTab] = useState("all");

  const loadData = async () => {
    if (profile?.referral_code) {
      const teamData = await getMultiLevelTeam(profile.referral_code);
      setTeam(teamData);
    }
    await refreshProfile();
  };

  useEffect(() => {
    loadData();
  }, [profile?.referral_code]);

  const currentVipLevel = profile?.vip_level ?? 0;
  const totalReferrals = team.total;
  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const nextVipThreshold = VIP_THRESHOLDS.slice().reverse().find(t => t.members > totalReferrals);
  const currentThreshold = VIP_THRESHOLDS.slice().reverse().find(t => t.members <= totalReferrals);
  const nextVipLevel = nextVipThreshold ? nextVipThreshold.level : 5;
  const requiredReferrals = nextVipThreshold ? nextVipThreshold.members : VIP_THRESHOLDS[0].members;
  const prevRequired = currentThreshold ? currentThreshold.members : 0;
  const progressPercentage = requiredReferrals > prevRequired 
    ? Math.min(((totalReferrals - prevRequired) / (requiredReferrals - prevRequired)) * 100, 100) 
    : 100;

  // Current and next rabat rate
  const currentRabat = RABAT_RATES.A; // simplified
  const nextRabat = currentVipLevel < 5 ? `${(currentRabat + 1)}%` : `${currentRabat}%`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Tersalin!", description: "Berhasil disalin ke clipboard" });
  };

  const shareWhatsApp = () => {
    const message = `🚀 Bergabung dengan SENT AI Drone Mapping!\n\nKode undangan: ${referralCode}\nDaftar: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Kode referral: ${referralCode}`)}`, '_blank');
  };

  const teamLevels = [
    { level: "A", name: "Level A", description: "Bawahan Langsung", commission: COMMISSION_RATES.A, rabat: RABAT_RATES.A, members: team.levelA, badgeColor: "bg-vip-gold text-white" },
    { level: "B", name: "Level B", description: "Generasi Kedua", commission: COMMISSION_RATES.B, rabat: RABAT_RATES.B, members: team.levelB, badgeColor: "bg-blue-500 text-white" },
    { level: "C", name: "Level C", description: "Generasi Ketiga", commission: COMMISSION_RATES.C, rabat: RABAT_RATES.C, members: team.levelC, badgeColor: "bg-amber-600 text-white" },
  ];

  const renderMemberCard = (member: Profile, level: string, badgeColor: string) => (
    <div key={member.id} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-foreground">{member.name}</p>
          <Badge className={`text-[9px] px-1 py-0 ${badgeColor}`}>{level}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">
          VIP {member.vip_level} • {new Date(member.created_at).toLocaleDateString('id-ID')}
        </p>
      </div>
      <Badge variant="success" className="text-[9px]">Aktif</Badge>
    </div>
  );

  return (
    <div className="space-y-4 p-4 pt-5">
      {/* Header Banner */}
      <Card className="bg-gradient-to-br from-primary/15 via-accent/10 to-vip-gold/15 border-primary/20 overflow-hidden">
        <CardContent className="p-4 text-center">
          <h2 className="text-base font-bold text-foreground mb-0.5">Agen</h2>
          <p className="text-xs text-muted-foreground">Hadiah pembelian pertama: <span className="text-primary font-bold">10%</span></p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] text-muted-foreground">Level VIP saya: <span className="font-bold text-foreground">VIP{currentVipLevel}</span></span>
            <span className="text-[11px] text-muted-foreground">| Hadiah: <span className="font-bold text-foreground">{RABAT_RATES.A}%</span></span>
          </div>
        </CardContent>
      </Card>

      {/* VIP Progression */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-center text-muted-foreground mb-3">Presentasi aktivitas</p>
          
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-muted rounded-xl p-3 text-center flex-1">
              <p className="text-[10px] text-muted-foreground">VIP{currentVipLevel}</p>
              <p className="text-lg font-bold text-primary">{RABAT_RATES.A}%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <div className="bg-primary/10 rounded-xl p-3 text-center flex-1">
              <p className="text-[10px] text-muted-foreground">VIP{nextVipLevel}</p>
              <p className="text-lg font-bold text-primary">{RABAT_RATES.A + 1}%</p>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">Hadiah pembelian ulang</p>
          {currentVipLevel < 5 && (
            <p className="text-xs text-center mt-1">
              Naik level dengan mengundang <span className="font-bold text-primary text-sm">{Math.max(0, requiredReferrals - totalReferrals)}</span> orang
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referral Link & Code */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tautan undangan saya:</p>
            <p className="text-xs text-primary break-all">{referralLink}</p>
          </div>
          
          <Button 
            className="w-full h-9 text-xs font-semibold"
            onClick={() => copyToClipboard(referralLink)}
          >
            Salin tautan undangan
          </Button>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kode undangan: <span className="text-primary font-bold">{referralCode}</span></span>
            <Button size="sm" variant="destructive" className="text-[10px] h-7 px-3 rounded-full" onClick={() => copyToClipboard(referralCode)}>
              Salin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-9 text-xs gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10" onClick={shareWhatsApp}>
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </Button>
        <Button variant="outline" className="h-9 text-xs gap-1.5 border-blue-500/30 text-blue-500 hover:bg-blue-500/10" onClick={shareTelegram}>
          <Send className="w-3.5 h-3.5" />
          Telegram
        </Button>
      </div>

      {/* Info tip */}
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Semakin tinggi level VIP, semakin besar hadiah pembelian ulang.
          </p>
        </CardContent>
      </Card>

      {/* Invitation Stats */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-center text-foreground mb-3">Undangan saya</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{totalReferrals} <span className="text-xs font-normal text-muted-foreground">orang</span></p>
              <p className="text-[10px] text-muted-foreground">Total undangan</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{team.levelA.length} <span className="text-xs font-normal text-muted-foreground">orang</span></p>
              <p className="text-[10px] text-muted-foreground">Undangan langsung</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total Komisi</p>
            <p className="text-xs font-bold text-primary">{formatCurrency(profile?.team_income || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total Rabat</p>
            <p className="text-xs font-bold text-vip-gold">{formatCurrency(profile?.rabat_income || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Structure */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-foreground">Struktur Komisi & Rabat</p>
          </div>
          <div className="space-y-2">
            {teamLevels.map((level) => (
              <div key={level.level} className="bg-muted/50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[9px] px-1.5 py-0 ${level.badgeColor}`}>{level.level}</Badge>
                    <span className="text-[11px] font-medium text-foreground">{level.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{level.description}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-muted-foreground">Komisi: <span className="font-bold text-primary">{level.commission}%</span></span>
                  <span className="text-muted-foreground">Rabat: <span className="font-bold text-vip-gold">{level.rabat}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-foreground">Anggota Tim ({team.total})</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-2 h-8">
              <TabsTrigger value="all" className="text-[10px]">Semua</TabsTrigger>
              <TabsTrigger value="A" className="text-[10px]">Level A</TabsTrigger>
              <TabsTrigger value="B" className="text-[10px]">Level B</TabsTrigger>
              <TabsTrigger value="C" className="text-[10px]">Level C</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {team.total === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Belum ada anggota tim</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {team.levelA.map(m => renderMemberCard(m, "A", teamLevels[0].badgeColor))}
                  {team.levelB.map(m => renderMemberCard(m, "B", teamLevels[1].badgeColor))}
                  {team.levelC.map(m => renderMemberCard(m, "C", teamLevels[2].badgeColor))}
                </div>
              )}
            </TabsContent>
            
            {teamLevels.map((level) => (
              <TabsContent key={level.level} value={level.level} className="mt-0">
                {level.members.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Belum ada anggota {level.name}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {level.members.map(m => renderMemberCard(m, level.level, level.badgeColor))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Need to import Separator
import { Separator } from "@/components/ui/separator";

export default Team;
