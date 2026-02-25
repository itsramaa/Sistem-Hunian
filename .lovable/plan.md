

# Dokumen ke Alat, Support Revamp, Feedback Page, Signature Feature, dan Customer Service Floating Button

## 1. Pindahkan Dokumen ke Alat (InsightsHub) dan Hapus dari Sidebar

**Saat ini:** "Dokumen" adalah item sidebar terpisah di grup Wawasan.
**Perubahan:** Hapus dari sidebar, tambahkan sebagai card di InsightsHub (seperti Kualitas Data).

**File yang diubah:**
- `navigation-config.ts`: Hapus `{ path: "/merchant/documents", ... }` dari mainNav, tambahkan `/merchant/documents` ke `activePatterns` item "Alat"
- `InsightsHub.tsx`: Tambah card "Pusat Dokumen" di section Performa dengan icon FileSearch dan path `/merchant/documents`

## 2. Revamp Support Page -- Hapus "Hubungi Kami", Fokus FAQ/Help

**Saat ini:** Support page punya form "Hubungi Kami", kontak langsung (email, WhatsApp, jam operasional)
**Perubahan:**
- Hapus seluruh "Contact Form" card dan "Kontak Langsung" card
- Pertahankan FAQ section dan perluas dengan lebih banyak kategori
- Tambah tombol "Tanya AI Assistant" yang membuka floating AI chatbot
- Pertahankan "Link Berguna" dan "Status Sistem" cards
- Sidebar secondary nav: ubah "Support" menjadi "Bantuan" yang tetap link ke `/merchant/support`

**File yang diubah:**
- `Support.tsx`: Hapus contact form & kontak langsung, tambah AI assistant CTA button

## 3. Buat Page Feedback untuk Merchant

**Baru:** Page `/merchant/feedback` untuk merchant memberikan masukan lengkap.

Fitur:
- Form dengan kategori (Fitur, Bug, UX, Lainnya)
- Rating bintang (1-5) untuk kepuasan
- Text area untuk deskripsi detail
- Screenshot upload opsional (via FileUpload)
- Riwayat feedback yang pernah dikirim
- Data disimpan ke tabel `merchant_feedback` di database

**File baru:**
- `src/pages/merchant/Feedback.tsx`

**File yang diubah:**
- `App.tsx`: Tambah route `/merchant/feedback`
- `app-sidebar.tsx`: Ubah secondary nav "Feedback" dari `mailto:` menjadi link ke `/merchant/feedback`

**Database migration:** Buat tabel `merchant_feedback` dengan kolom: id, merchant_id, user_id, category, rating, message, screenshot_url, status (pending/reviewed/resolved), created_at

## 4. Tambahkan Fitur Signature Dialog Standalone

**Saat ini:** SignaturePad sudah ada di `src/features/signature/components/SignaturePad.tsx` dan dipakai di SignContractDialog dan MoveOutInspectionForm.

**Perubahan:** Buat dialog reusable `SignatureDialog` yang bisa dipanggil dari mana saja untuk menandatangani dokumen, lalu menyimpan signature sebagai image.

**File baru:**
- `src/features/signature/components/SignatureDialog.tsx`: Dialog wrapper yang berisi SignaturePad, preview hasil, dan tombol save. Menerima props `onSave(dataUrl: string)`, `title`, `description`.

Komponen ini bisa diintegrasikan ke halaman mana pun yang membutuhkan tanda tangan digital.

## 5. Upgrade Floating AI Button Menjadi Customer Service Hub

**Saat ini:** Floating button hanya membuka AI chatbot (ChatbotDialog).
**Perubahan:** Transformasi menjadi Customer Service Hub seperti e-commerce best practice:

### A. Multi-Tab Interface di ChatbotDialog
Tambah tab navigation di header chatbot:
- **AI Assistant** (tab default): Chatbot AI yang sudah ada, sesuai role
- **FAQ** (tab kedua): Quick FAQ accordion inline tanpa navigate ke page lain
- **Live Chat** (tab ketiga): Chat langsung ke admin (real-time via database)

### B. Live Chat Implementation
- Buat tabel `live_chat_conversations` (id, user_id, merchant_id, role, status: open/closed, created_at, updated_at)
- Buat tabel `live_chat_messages` (id, conversation_id, sender_id, sender_role, message, created_at)
- Enable realtime pada `live_chat_messages`
- Di sisi merchant: jika AI tidak bisa menjawab, tampilkan tombol "Hubungi Admin" yang switch ke tab Live Chat
- Di sisi admin: tambah page `/admin/live-chat` untuk melihat dan membalas pesan live chat

### C. AI Escalation Flow
- Jika AI merespons dengan confidence rendah atau user mengetik "hubungi admin" / "bicara dengan manusia", tampilkan prompt: "Sepertinya pertanyaan ini perlu bantuan langsung. Ingin dihubungkan ke tim support?"
- Jika user klik ya, auto-switch ke tab Live Chat dan buat conversation baru

### D. Visual Updates
- Floating button tetap sama (MessageCircle icon)
- Dialog header: tambah 3 tab pills (AI / FAQ / Live Chat)
- Badge notifikasi di tab Live Chat jika ada pesan baru dari admin

---

## Files Summary

| File | Change |
|------|--------|
| `src/shared/components/layouts/navigation-config.ts` | Hapus Dokumen dari sidebar, tambah ke activePatterns Alat |
| `src/pages/merchant/InsightsHub.tsx` | Tambah card Pusat Dokumen |
| `src/pages/merchant/Support.tsx` | Hapus contact form & kontak langsung, tambah AI CTA |
| `src/pages/merchant/Feedback.tsx` | **Baru**: Page feedback lengkap |
| `src/App.tsx` | Tambah route feedback, lazy import |
| `src/shared/components/layouts/sidebar/app-sidebar.tsx` | Ubah secondary nav: Support -> Bantuan, Feedback -> link ke /feedback page |
| `src/features/signature/components/SignatureDialog.tsx` | **Baru**: Reusable signature dialog |
| `src/features/chatbot/components/ChatbotDialog.tsx` | Refactor jadi multi-tab: AI / FAQ / Live Chat |
| `src/features/chatbot/components/LiveChatTab.tsx` | **Baru**: Live chat tab component |
| `src/features/chatbot/components/FaqTab.tsx` | **Baru**: Inline FAQ tab component |

## Database Migrations

```sql
-- Tabel feedback merchant
CREATE TABLE public.merchant_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feature', 'bug', 'ux', 'other')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel live chat
CREATE TABLE public.live_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'waiting')),
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.live_chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- RLS policies
ALTER TABLE public.merchant_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Feedback: merchant can insert/read own
CREATE POLICY "Users can insert own feedback" ON public.merchant_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON public.merchant_feedback FOR SELECT USING (auth.uid() = user_id);
-- Admin can read/update all feedback
CREATE POLICY "Admin can manage feedback" ON public.merchant_feedback FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Live chat: users see own conversations
CREATE POLICY "Users see own conversations" ON public.live_chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own conversations" ON public.live_chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage all conversations" ON public.live_chat_conversations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Live chat messages: participants can see/send
CREATE POLICY "Participants see messages" ON public.live_chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.live_chat_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Participants send messages" ON public.live_chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admin manage messages" ON public.live_chat_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

## Technical Notes

- Live Chat menggunakan Supabase Realtime untuk pesan instan antara user dan admin
- AI escalation: deteksi keyword "hubungi admin", "bicara manusia", "live chat" di pesan user atau setelah 2x AI gagal menjawab
- SignatureDialog adalah wrapper tipis di atas SignaturePad yang sudah ada -- tidak duplikasi logic canvas
- Feedback page menggunakan FileUpload yang sudah ada untuk screenshot upload ke bucket `verification-documents`
- FAQ tab di chatbot menggunakan data yang sama dengan Support page (shared constant)
- Referral sudah ada di sidebar dari perubahan sebelumnya, tidak perlu diubah lagi

