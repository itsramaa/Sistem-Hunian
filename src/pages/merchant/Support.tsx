import { LifeBuoy, ExternalLink, Globe, Database, CreditCard, MessageCircle, BookOpen, Shield, Settings, Users } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { useNavigate } from "react-router-dom";

export const faqCategories = [
  {
    category: "Properti & Unit",
    icon: BookOpen,
    items: [
      {
        q: "Bagaimana cara menambahkan properti baru?",
        a: "Buka menu Properties, klik tombol 'Tambah Properti', lalu isi detail seperti nama, alamat, dan jumlah unit. Setelah menyimpan, Anda bisa menambahkan unit-unit di dalam properti tersebut."
      },
      {
        q: "Bagaimana cara mengelola unit di properti?",
        a: "Masuk ke detail properti, lalu buka tab 'Unit'. Di sana Anda bisa menambah, mengedit, atau menghapus unit. Setiap unit memiliki detail fasilitas, harga, dan status okupansi."
      },
    ],
  },
  {
    category: "Kontrak & Penyewa",
    icon: Users,
    items: [
      {
        q: "Bagaimana cara membuat kontrak untuk tenant?",
        a: "Navigasi ke menu Contracts, klik 'Buat Kontrak Baru'. Pilih tenant, unit, tentukan tanggal mulai & akhir, serta jumlah sewa. Kontrak akan dikirim ke tenant untuk ditandatangani secara digital."
      },
      {
        q: "Apa yang terjadi jika tenant ingin pindah lebih awal?",
        a: "Tenant dapat mengajukan early termination melalui portal mereka. Anda akan menerima notifikasi dan bisa menyetujui/menolak permintaan beserta penalti sesuai kontrak."
      },
    ],
  },
  {
    category: "Pembayaran & Keuangan",
    icon: CreditCard,
    items: [
      {
        q: "Bagaimana proses pembayaran sewa bekerja?",
        a: "Invoice otomatis dibuat berdasarkan kontrak. Tenant menerima notifikasi dan bisa membayar via berbagai metode (transfer bank, e-wallet). Pembayaran akan langsung ditransfer ke rekening bank utama Anda secara otomatis."
      },
      {
        q: "Apa yang terjadi jika tenant telat bayar?",
        a: "Sistem otomatis mengirim reminder. Jika melewati grace period, late fee akan dikenakan sesuai pengaturan kontrak. Anda bisa memonitor status di halaman Invoices dan Collections."
      },
      {
        q: "Bagaimana cara upgrade subscription?",
        a: "Buka menu Billing, pilih plan yang diinginkan dari pricing table. Klik 'Upgrade' dan ikuti proses pembayaran. Fitur baru akan langsung aktif setelah pembayaran berhasil."
      },
    ],
  },
  {
    category: "Maintenance",
    icon: Settings,
    items: [
      {
        q: "Bagaimana cara mengajukan maintenance request?",
        a: "Tenant mengajukan request melalui portal mereka. Anda akan menerima notifikasi dan bisa assign vendor, track progress, serta menandai penyelesaian. Semua histori tercatat di timeline."
      },
      {
        q: "Bagaimana sistem SLA maintenance bekerja?",
        a: "Setiap request otomatis mendapat deadline SLA berdasarkan prioritas: urgent (4 jam), high (24 jam), medium (72 jam), low (7 hari). Anda bisa memantau SLA di dashboard maintenance."
      },
    ],
  },
  {
    category: "Keamanan & Akun",
    icon: Shield,
    items: [
      {
        q: "Bagaimana cara verifikasi akun merchant?",
        a: "Buka Profile > tab Verification. Upload dokumen yang diperlukan (KTP, SIUP/NIB, bukti kepemilikan). Tim kami akan review dalam 1-3 hari kerja."
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya, kami menggunakan enkripsi end-to-end, two-factor authentication, dan infrastruktur cloud terpercaya. Data keuangan diproses melalui payment gateway bersertifikasi PCI-DSS."
      },
    ],
  },
];

export default function Support() {
  const navigate = useNavigate();

  const handleOpenAI = () => {
    // Trigger the floating AI chatbot by dispatching a custom event
    window.dispatchEvent(new CustomEvent('open-chatbot'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LifeBuoy}
        title="Pusat Bantuan"
        description="Temukan jawaban untuk pertanyaan Anda"
      />

      {/* AI Assistant CTA */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold">Butuh bantuan cepat?</h3>
            <p className="text-sm text-muted-foreground">Tanya AI Assistant kami yang siap membantu 24/7 untuk pertanyaan seputar bisnis Anda.</p>
          </div>
          <Button onClick={handleOpenAI} className="gradient-cta rounded-xl">
            <MessageCircle className="h-4 w-4 mr-2" />
            Tanya AI Assistant
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          {faqCategories.map((cat, catIdx) => (
            <Card key={catIdx} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{cat.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {cat.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${catIdx}-${i}`}
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
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                { label: "Kirim Feedback", path: "/merchant/feedback" },
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
