# Proposal: feat-03-responsive-ui

## Summary
SRS §8 dan NFR-02 mensyaratkan semua breakpoint (mobile <640px, tablet 640–1024px, desktop >1024px) berfungsi tanpa kehilangan fitur. Implementasi saat ini tidak konsisten — beberapa halaman punya mobile view, beberapa tidak, dan tablet belum diperhatikan.

## Problem
- Form modal bisa overflow di layar 360px
- Tabel card view tidak konsisten di semua halaman
- Tablet breakpoint (640–1024px) belum dioptimasi
- Beberapa tombol di bawah 44px touch target minimum

## Solution
Audit semua halaman, implementasi card view untuk mobile secara konsisten, optimasi layout tablet, dan pastikan touch targets ≥ 44px.

## Requirements

### MODIFIED — Mobile (sm < 640px)
- Semua tabel SHALL menggunakan card/stacked view di mobile
- Form modal SHALL menggunakan bottom sheet atau scroll yang proper, tidak overflow layar
- Sidebar SHALL collapsible dan accessible di mobile
- Scenario: Buka halaman payments di 360px → tabel tampil sebagai cards, bukan tabel horizontal

### ADDED — Tablet (md 640–1024px)
- Layout tablet SHALL tidak terlalu narrow (tidak sama dengan mobile, tidak sama dengan desktop)
- Tabel SHALL tetap readable, minimal kolom kritis tetap tampil
- Sidebar SHALL dalam state yang tepat (tidak collapsed penuh seperti mobile, tidak full seperti desktop)
- Scenario: Buka dashboard di 768px → layout proporsional, sidebar visible, content readable

### MODIFIED — Touch Targets
- Semua button interaktif SHALL minimum `h-11` (44px) di mobile view
- Tombol aksi di tabel (Edit, Hapus, Checkout, dll) SHALL memenuhi 44px
- Scenario: Di 360px, semua tombol mudah di-tap tanpa misclick

## Non-Goals
- Tidak mengubah fitur atau business logic
- Tidak mengubah tampilan desktop (>1024px)
- Tidak perlu PWA atau offline support

## Dependencies
- `useIsMobile` hook sudah ada di `src/shared/hooks/useBreakpoint.ts`
- `DataCard` component sudah ada di `src/shared/components/DataCard.tsx`
