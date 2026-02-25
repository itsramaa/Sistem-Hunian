import { useState } from "react";
import { LifeBuoy, Mail, Phone, Clock, ExternalLink, CheckCircle2, Send, ChevronDown, Globe, Database, CreditCard } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const faqItems = [
  {
    q: "Bagaimana cara menambahkan properti baru?",
    a: "Buka menu Properties, klik tombol 'Tambah Properti', lalu isi detail seperti nama, alamat, dan jumlah unit. Setelah menyimpan, Anda bisa menambahkan unit-unit di dalam properti tersebut."
  },
  {
    q: "Bagaimana cara membuat kontrak untuk tenant?",
    a: "Navigasi ke menu Contracts, klik 'Buat Kontrak Baru'. Pilih tenant, unit, tentukan tanggal mulai & akhir, serta jumlah sewa. Kontrak akan dikirim ke tenant untuk ditandatangani secara digital."
  },
  {
    q: "Bagaimana proses pembayaran sewa bekerja?",
    a: "Invoice otomatis dibuat berdasarkan kontrak. Tenant menerima notifikasi dan bisa membayar via berbagai metode (transfer bank, e-wallet). Pembayaran masuk ke escrow dan akan di-disbursement ke rekening Anda."
  },
  {
    q: "Apa yang terjadi jika tenant telat bayar?",
    a: "Sistem otomatis mengirim reminder. Jika melewati grace period, late fee akan dikenakan sesuai pengaturan kontrak. Anda bisa memonitor status di halaman Invoices dan Collections."
  },
  {
    q: "Bagaimana cara mengajukan maintenance request?",
    a: "Tenant mengajukan request melalui portal mereka. Anda akan menerima notifikasi dan bisa assign vendor, track progress, serta menandai penyelesaian. Semua histori tercatat di timeline."
  },
  {
    q: "Bagaimana cara upgrade subscription?",
    a: "Buka menu Billing, pilih plan yang diinginkan dari pricing table. Klik 'Upgrade' dan ikuti proses pembayaran. Fitur baru akan langsung aktif setelah pembayaran berhasil."
  },
  {
    q: "Bagaimana cara verifikasi akun merchant?",
    a: "Buka Profile > tab Verification. Upload dokumen yang diperlukan (KTP, SIUP/NIB, bukti kepemilikan). Tim kami akan review dalam 1-3 hari kerja. Status verifikasi bisa dipantau di halaman yang sama."
  },
  {
    q: "Apakah data saya aman?",
    a: "Ya, kami menggunakan enkripsi end-to-end, two-factor authentication, dan infrastruktur cloud terpercaya. Data keuangan diproses melalui payment gateway bersertifikasi PCI-DSS. Backup dilakukan secara otomatis setiap hari."
  },
];

const subjectOptions = [
  { value: "billing", label: "Billing & Pembayaran" },
  { value: "technical", label: "Masalah Teknis" },
  { value: "account", label: "Akun & Profil" },
  { value: "feature", label: "Permintaan Fitur" },
  { value: "other", label: "Lainnya" },
];

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Mohon lengkapi subjek dan pesan.");
      return;
    }
    setSubmitted(true);
    toast.success("Pesan terkirim! Tim kami akan merespons dalam 1x24 jam.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LifeBuoy}
        title="Pusat Bantuan"
        description="Temukan jawaban atau hubungi tim support kami"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Pertanyaan Umum (FAQ)</CardTitle>
              <CardDescription>Jawaban cepat untuk pertanyaan yang sering diajukan</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm px-4 data-[state=open]:bg-primary/5"
                  >
                    <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Hubungi Kami</CardTitle>
              <CardDescription>Kirim pesan dan tim kami akan merespons dalam 1x24 jam</CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Pesan Terkirim!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tim support kami akan menghubungi Anda segera melalui email.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); setEmail(""); }}
                  >
                    Kirim Pesan Lagi
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Email (opsional)</Label>
                    <Input
                      id="support_email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl bg-background/60 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_subject">Subjek <span className="text-destructive">*</span></Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="support_subject" className="rounded-xl bg-background/60 border-border/50">
                        <SelectValue placeholder="Pilih topik..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-popover/95 border border-border/40">
                        {subjectOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_message">Pesan <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="support_message"
                      placeholder="Jelaskan pertanyaan atau masalah Anda..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="rounded-xl bg-background/60 border-border/50 min-h-[120px]"
                    />
                  </div>
                  <Button type="submit" className="gradient-cta rounded-xl w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                    Kirim Pesan
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Contact */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Kontak Langsung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="mailto:support@sihuni.com"
                className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-primary/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">support@sihuni.com</p>
                </div>
              </a>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-primary/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">+62 812-3456-7890</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Jam Operasional</p>
                  <p className="text-xs text-muted-foreground">Senin - Jumat, 09:00 - 18:00 WIB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Useful Links */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Link Berguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Pengaturan Akun", path: "/merchant/settings" },
                { label: "Billing & Langganan", path: "/merchant/billing" },
                { label: "Profil Bisnis", path: "/merchant/profile" },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/5 transition-colors text-sm text-left"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "API & Platform", icon: Globe, status: "Operasional" },
                { label: "Database", icon: Database, status: "Operasional" },
                { label: "Payment Gateway", icon: CreditCard, status: "Operasional" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-card/80 border border-border/40" role="status">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                    <span className="text-xs text-success font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
