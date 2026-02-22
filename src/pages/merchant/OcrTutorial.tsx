import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { ScanText, Upload, CheckCircle2, ArrowRight, FileText, CreditCard, Wrench, Building2, Eye, Sparkles } from "lucide-react";

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "Pilih Jenis Dokumen",
    description: "SiHuni mendukung 4 jenis dokumen OCR yang dapat membantu operasional kos Anda.",
    icon: FileText,
  },
  {
    id: 2,
    title: "Upload Dokumen",
    description: "Upload foto atau scan dokumen. Pastikan gambar jelas dan teks terbaca.",
    icon: Upload,
  },
  {
    id: 3,
    title: "AI Memproses",
    description: "AI Gemini Vision akan mengekstrak data dari dokumen dalam hitungan detik.",
    icon: Sparkles,
  },
  {
    id: 4,
    title: "Review & Konfirmasi",
    description: "Tinjau hasil ekstraksi, perbaiki jika perlu, lalu konfirmasi untuk menyimpan.",
    icon: CheckCircle2,
  },
];

const OCR_TYPES = [
  {
    id: "ktp",
    title: "KTP Penghuni",
    description: "Ekstrak NIK, nama, alamat, dan data identitas lainnya dari KTP. Auto-fill profil penghuni.",
    icon: FileText,
    tier: "Professional",
    avgTime: "2-3 detik",
    fields: ["NIK", "Nama", "Tempat/Tanggal Lahir", "Alamat", "Jenis Kelamin"],
    color: "hsl(var(--primary))",
  },
  {
    id: "payment_proof",
    title: "Bukti Transfer",
    description: "Ekstrak nominal, bank, pengirim, dan tanggal dari bukti transfer. Auto-match dengan tagihan.",
    icon: CreditCard,
    tier: "Basic",
    avgTime: "1-2 detik",
    fields: ["Nominal", "Bank", "Pengirim", "Penerima", "Tanggal", "No. Referensi"],
    color: "hsl(var(--success))",
  },
  {
    id: "business_doc",
    title: "Dokumen Bisnis",
    description: "Ekstrak data dari NIB, SIUP, Akta Pendirian, atau NPWP untuk verifikasi merchant.",
    icon: Building2,
    tier: "Professional",
    avgTime: "2-4 detik",
    fields: ["No. Dokumen", "Nama Usaha", "Pemilik", "Alamat", "Tanggal Terbit"],
    color: "hsl(var(--info))",
  },
  {
    id: "maintenance_receipt",
    title: "Nota Maintenance",
    description: "Ekstrak item, total, dan vendor dari nota/struk untuk pencatatan biaya maintenance.",
    icon: Wrench,
    tier: "Professional",
    avgTime: "2-3 detik",
    fields: ["Vendor", "Item", "Qty", "Harga", "Total", "Tanggal"],
    color: "hsl(var(--warning))",
  },
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
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {TUTORIAL_STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              idx === currentStep
                ? "bg-primary text-primary-foreground"
                : idx < currentStep
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanText className="h-5 w-5 text-primary" />
                Langkah 1: Pilih Jenis Dokumen
              </CardTitle>
              <CardDescription>
                Pilih jenis dokumen yang ingin Anda proses dengan OCR. Setiap jenis memiliki AI yang dilatih khusus.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OCR_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <type.icon className="h-5 w-5" style={{ color: type.color }} />
                      {type.title}
                    </CardTitle>
                    <Badge variant="secondary">{type.tier}</Badge>
                  </div>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Waktu proses: {type.avgTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {type.fields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Langkah 2: Upload Dokumen
            </CardTitle>
            <CardDescription>Upload foto atau scan dokumen Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Drag & drop atau klik untuk upload</p>
                <p className="text-sm text-muted-foreground">Format: JPG, PNG, PDF (max 10MB)</p>
              </div>
              <Button variant="outline" disabled>
                Pilih File (Demo)
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm">Tips untuk hasil OCR terbaik:</p>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Langkah 3: AI Memproses Dokumen
            </CardTitle>
            <CardDescription>AI Gemini Vision menganalisis dan mengekstrak data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ScanText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Proses Ekstraksi</p>
                  <p className="text-sm text-muted-foreground">AI mengidentifikasi dan mengekstrak field data</p>
                </div>
                <Badge>2-4 detik</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deteksi teks</span>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Klasifikasi field</span>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Validasi data</span>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skor kepercayaan</span>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-medium text-primary">Bagaimana cara kerjanya?</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI Vision menganalisis gambar dokumen, mengidentifikasi area teks, 
                mengekstrak informasi terstruktur, dan memberikan skor kepercayaan (confidence) 
                untuk setiap field. Jika kepercayaan &lt; 80%, sistem akan meminta review manual.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Langkah 4: Review & Konfirmasi
            </CardTitle>
            <CardDescription>Tinjau hasil ekstraksi AI dan konfirmasi data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample extracted result */}
            <div className="border rounded-lg divide-y">
              {[
                { label: "NIK", value: "3201XXXXXXXXXXXX", confidence: 95 },
                { label: "Nama", value: "JOHN DOE", confidence: 98 },
                { label: "Tempat Lahir", value: "JAKARTA", confidence: 92 },
                { label: "Tanggal Lahir", value: "01-01-1990", confidence: 88 },
                { label: "Alamat", value: "JL. CONTOH NO. 123", confidence: 75 },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-sm text-muted-foreground">{field.value}</p>
                  </div>
                  <Badge variant={field.confidence >= 80 ? "default" : "secondary"}>
                    {field.confidence}%
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <Eye className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm text-warning">
                Field "Alamat" memiliki confidence rendah (75%). Harap periksa dan koreksi jika perlu.
              </p>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" disabled>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Konfirmasi Data (Demo)
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Ini adalah demo tutorial. Untuk menggunakan OCR, navigasikan ke halaman terkait 
              (Tenants, Payments, Maintenance) dan gunakan tombol Upload Dokumen.
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
        >
          Sebelumnya
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(TUTORIAL_STEPS.length - 1, currentStep + 1))}
          disabled={currentStep === TUTORIAL_STEPS.length - 1}
        >
          Selanjutnya
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default OcrTutorial;
