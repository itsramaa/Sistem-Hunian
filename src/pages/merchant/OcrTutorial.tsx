import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { ScanText, Upload, CheckCircle2, ArrowRight, FileText, CreditCard, Wrench, Building2, Eye, Sparkles, ArrowLeft } from "lucide-react";

const TUTORIAL_STEPS = [
  { id: 1, title: "Pilih Jenis Dokumen", description: "SiHuni mendukung 4 jenis dokumen OCR yang dapat membantu operasional kos Anda.", icon: FileText },
  { id: 2, title: "Upload Dokumen", description: "Upload foto atau scan dokumen. Pastikan gambar jelas dan teks terbaca.", icon: Upload },
  { id: 3, title: "AI Memproses", description: "AI Gemini Vision akan mengekstrak data dari dokumen dalam hitungan detik.", icon: Sparkles },
  { id: 4, title: "Review & Konfirmasi", description: "Tinjau hasil ekstraksi, perbaiki jika perlu, lalu konfirmasi untuk menyimpan.", icon: CheckCircle2 },
];

const OCR_TYPES = [
  { id: "ktp", title: "KTP Penghuni", description: "Ekstrak NIK, nama, alamat, dan data identitas lainnya dari KTP. Auto-fill profil penghuni.", icon: FileText, tier: "Professional", avgTime: "2-3 detik", fields: ["NIK", "Nama", "Tempat/Tanggal Lahir", "Alamat", "Jenis Kelamin"], iconBg: "from-primary/20 to-primary/5" },
  { id: "payment_proof", title: "Bukti Transfer", description: "Ekstrak nominal, bank, pengirim, dan tanggal dari bukti transfer. Auto-match dengan tagihan.", icon: CreditCard, tier: "Basic", avgTime: "1-2 detik", fields: ["Nominal", "Bank", "Pengirim", "Penerima", "Tanggal", "No. Referensi"], iconBg: "from-success/20 to-success/5" },
  { id: "business_doc", title: "Dokumen Bisnis", description: "Ekstrak data dari NIB, SIUP, Akta Pendirian, atau NPWP untuk verifikasi merchant.", icon: Building2, tier: "Professional", avgTime: "2-4 detik", fields: ["No. Dokumen", "Nama Usaha", "Pemilik", "Alamat", "Tanggal Terbit"], iconBg: "from-info/20 to-info/5" },
  { id: "maintenance_receipt", title: "Nota Maintenance", description: "Ekstrak item, total, dan vendor dari nota/struk untuk pencatatan biaya maintenance.", icon: Wrench, tier: "Professional", avgTime: "2-3 detik", fields: ["Vendor", "Item", "Qty", "Harga", "Total", "Tanggal"], iconBg: "from-warning/20 to-warning/5" },
];

function OcrTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const progress = ((currentStep + 1) / (TUTORIAL_STEPS.length + 1)) * 100;

  return (
    <div className="space-y-6">
      <PageHeader icon={ScanText} title="OCR Tutorial" description="Pelajari cara menggunakan OCR untuk memproses dokumen" />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress Tutorial</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70" />
      </div>

      {/* Step Navigator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {TUTORIAL_STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 border ${
              idx === currentStep
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-sm"
                : idx < currentStep
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card/80 backdrop-blur-sm text-muted-foreground border-border/40 hover:border-primary/30"
            }`}
          >
            <step.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{step.title}</span>
            <span className="sm:hidden">{step.id}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <ScanText className="h-4.5 w-4.5 text-primary" />
                </div>
                Langkah 1: Pilih Jenis Dokumen
              </CardTitle>
              <CardDescription>Pilih jenis dokumen yang ingin Anda proses dengan OCR. Setiap jenis memiliki AI yang dilatih khusus.</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OCR_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-300 rounded-2xl bg-card/90 backdrop-blur-sm border hover:-translate-y-1 hover:shadow-lg ${
                  selectedType === type.id ? "ring-2 ring-primary border-primary/50" : "border-border/40 hover:border-primary/30"
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2.5">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${type.iconBg} flex items-center justify-center`}>
                        <type.icon className="h-4.5 w-4.5 text-foreground/70" />
                      </div>
                      {type.title}
                    </CardTitle>
                    <Badge variant="secondary" className="rounded-full">{type.tier}</Badge>
                  </div>
                  <CardDescription className="ml-[46px]">{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Waktu proses: {type.avgTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {type.fields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs rounded-full">{field}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Upload className="h-4.5 w-4.5 text-primary" />
              </div>
              Langkah 2: Upload Dokumen
            </CardTitle>
            <CardDescription>Upload foto atau scan dokumen Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-2xl p-12 text-center space-y-4 bg-background/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center mx-auto">
                <Upload className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Drag & drop atau klik untuk upload</p>
                <p className="text-sm text-muted-foreground">Format: JPG, PNG, PDF (max 10MB)</p>
              </div>
              <Button variant="outline" disabled className="rounded-xl">Pilih File (Demo)</Button>
            </div>
            <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 space-y-2 border border-border/30">
              <p className="font-semibold text-sm">Tips untuk hasil OCR terbaik:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Pastikan dokumen dalam kondisi terang dan tidak blur</li>
                <li>Hindari bayangan atau pantulan cahaya</li>
                <li>Foto seluruh dokumen, jangan terpotong</li>
                <li>Gunakan resolusi minimal 720p</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              Langkah 3: AI Memproses Dokumen
            </CardTitle>
            <CardDescription>AI Gemini Vision menganalisis dan mengekstrak data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <ScanText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Proses Ekstraksi</p>
                  <p className="text-sm text-muted-foreground">AI mengidentifikasi dan mengekstrak field data</p>
                </div>
                <Badge variant="outline" className="rounded-full">2-4 detik</Badge>
              </div>
              <div className="space-y-2">
                {["Deteksi teks", "Klasifikasi field", "Validasi data", "Skor kepercayaan"].map((step) => (
                  <div key={step} className="flex justify-between text-sm items-center">
                    <span>{step}</span>
                    <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="text-sm font-semibold text-primary">Bagaimana cara kerjanya?</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI Vision menganalisis gambar dokumen, mengidentifikasi area teks, mengekstrak informasi terstruktur, dan memberikan skor kepercayaan (confidence) untuk setiap field. Jika kepercayaan &lt; 80%, sistem akan meminta review manual.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5 text-success" />
              </div>
              Langkah 4: Review & Konfirmasi
            </CardTitle>
            <CardDescription>Tinjau hasil ekstraksi AI dan konfirmasi data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border/40">
              {[
                { label: "NIK", value: "3201XXXXXXXXXXXX", confidence: 95 },
                { label: "Nama", value: "JOHN DOE", confidence: 98 },
                { label: "Tempat Lahir", value: "JAKARTA", confidence: 92 },
                { label: "Tanggal Lahir", value: "01-01-1990", confidence: 88 },
                { label: "Alamat", value: "JL. CONTOH NO. 123", confidence: 75 },
              ].map((field, idx) => (
                <div key={field.label} className={`flex items-center justify-between p-3 ${idx > 0 ? 'border-t border-border/30' : ''} bg-card/60 backdrop-blur-sm`}>
                  <div>
                    <p className="text-sm font-semibold">{field.label}</p>
                    <p className="text-sm text-muted-foreground">{field.value}</p>
                  </div>
                  <Badge variant={field.confidence >= 80 ? "default" : "secondary"} className="rounded-full">
                    {field.confidence}%
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-xl border border-warning/20">
              <Eye className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm text-warning">
                Field "Alamat" memiliki confidence rendah (75%). Harap periksa dan koreksi jika perlu.
              </p>
            </div>

            <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-2" disabled>
              <CheckCircle2 className="h-4 w-4" />
              Konfirmasi Data (Demo)
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Ini adalah demo tutorial. Untuk menggunakan OCR, navigasikan ke halaman terkait (Tenants, Payments, Maintenance) dan gunakan tombol Upload Dokumen.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Sebelumnya
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(TUTORIAL_STEPS.length - 1, currentStep + 1))}
          disabled={currentStep === TUTORIAL_STEPS.length - 1}
          className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-2"
        >
          Selanjutnya
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default OcrTutorial;
