import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Phone, Mail, Globe, Shield, Award, Users, TrendingUp, Clock, Target, Briefcase, CheckCircle2 } from "lucide-react";
import companyBuilding from "@/assets/company-building.jpg";
import companyOffice from "@/assets/company-office.jpg";

interface CompanyProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompanyProfileDialog = ({ open, onOpenChange }: CompanyProfileDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Profil Perusahaan
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang Apptronik Indonesia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Building Image */}
          <div className="relative rounded-xl overflow-hidden">
            <img 
              src={companyBuilding} 
              alt="Kantor Pusat Apptronik" 
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <Badge variant="vip" className="text-xs">Kantor Pusat Jakarta</Badge>
            </div>
          </div>

          {/* Company Logo & Name */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary via-accent to-vip-gold rounded-2xl flex items-center justify-center shadow-glow mb-4">
              <span className="text-3xl font-bold text-white">IP</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">PT Apptronik Indonesia</h2>
            <Badge variant="vip" className="mt-2">Platform Investasi Digital Terpercaya</Badge>
          </div>

          <Separator />

          {/* About with More Detail */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-vip-gold" />
              Tentang Kami
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Apptronik</strong> adalah platform investasi digital terkemuka di Indonesia yang menyediakan 
              berbagai produk investasi dengan return kompetitif dan keamanan terjamin. Kami menawarkan 
              akses mudah ke berbagai instrumen investasi yang sebelumnya hanya tersedia untuk investor institusional.
            </p>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Visi</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Menjadi platform investasi digital #1 di Indonesia yang memberikan akses investasi 
                inklusif untuk semua kalangan masyarakat.
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg border border-success/30">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-success" />
                <span className="font-semibold text-sm text-foreground">Misi</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Menyediakan produk investasi yang aman, transparan, dan menguntungkan dengan 
                teknologi terdepan serta layanan pelanggan 24/7.
              </p>
            </div>
          </div>

          {/* Office Interior Image */}
          <div className="relative rounded-xl overflow-hidden">
            <img 
              src={companyOffice} 
              alt="Suasana Kantor Apptronik" 
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-2 left-3">
              <p className="text-xs text-foreground font-medium">Tim profesional kami siap melayani Anda</p>
            </div>
          </div>

          {/* Stats with Explanation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Pencapaian Kami
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/50">
                <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">100K+</p>
                <p className="text-xs text-muted-foreground">Investor Aktif</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/50">
                <TrendingUp className="w-5 h-5 mx-auto text-success mb-1" />
                <p className="text-lg font-bold text-foreground">15%</p>
                <p className="text-xs text-muted-foreground">Rata-rata ROI</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/50">
                <Clock className="w-5 h-5 mx-auto text-accent mb-1" />
                <p className="text-lg font-bold text-foreground">4+ Thn</p>
                <p className="text-xs text-muted-foreground">Pengalaman</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
              💡 <strong>Apa artinya?</strong> Dengan lebih dari 100.000 investor dan rata-rata 
              return 15% per tahun, Apptronik telah membuktikan komitmen dalam memberikan hasil investasi yang optimal.
            </p>
          </div>

          <Separator />

          {/* Why Choose Us */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Mengapa Pilih Apptronik?
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Keamanan Terjamin</p>
                  <p className="text-xs text-muted-foreground">Dana Anda disimpan di rekening terpisah dan dilindungi sistem enkripsi tingkat bank.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Transparan & Terpercaya</p>
                  <p className="text-xs text-muted-foreground">Semua transaksi tercatat dengan jelas. Anda bisa pantau investasi kapan saja.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Dukungan 24/7</p>
                  <p className="text-xs text-muted-foreground">Tim customer service kami siap membantu Anda kapan pun dibutuhkan.</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Hubungi Kami
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="text-sm text-foreground block">Jl. Jend. Sudirman No. 123, Lantai 25</span>
                  <span className="text-xs text-muted-foreground">Jakarta Pusat 10220, Indonesia</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-foreground block">+62 812-3456-7890</span>
                  <span className="text-xs text-muted-foreground">Senin - Jumat, 09:00 - 18:00 WIB</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">support@investpro.id</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">www.investpro.id</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Legal with Explanation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              Legalitas Perusahaan
            </h3>
            <p className="text-xs text-muted-foreground">
              Perusahaan kami telah terdaftar secara resmi dan memiliki izin operasional yang lengkap:
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg border border-success/30">
                <div>
                  <span className="text-muted-foreground block text-xs">Nomor Induk Berusaha (NIB)</span>
                  <span className="font-medium text-foreground">1234567890123</span>
                </div>
                <Badge variant="success" className="text-xs">Terverifikasi</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg border border-success/30">
                <div>
                  <span className="text-muted-foreground block text-xs">NPWP Perusahaan</span>
                  <span className="font-medium text-foreground">12.345.678.9-012.345</span>
                </div>
                <Badge variant="success" className="text-xs">Aktif</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg border border-success/30">
                <div>
                  <span className="text-muted-foreground block text-xs">SK Kemenkumham</span>
                  <span className="font-medium text-foreground">AHU-0012345.AH.01.01</span>
                </div>
                <Badge variant="success" className="text-xs">Valid</Badge>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
              ℹ️ <strong>NIB</strong> adalah bukti pendaftaran usaha di OSS. <strong>NPWP</strong> menunjukkan 
              kepatuhan pajak. <strong>SK Kemenkumham</strong> adalah bukti pengesahan badan hukum.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
            <p className="text-xs text-muted-foreground">
              ⚠️ <strong>Disclaimer:</strong> Investasi mengandung risiko termasuk risiko kehilangan modal. 
              Pastikan Anda memahami produk investasi dan profil risiko Anda sebelum berinvestasi. 
              Kinerja masa lalu bukan jaminan kinerja masa depan. Selalu diversifikasi portofolio Anda.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyProfileDialog;