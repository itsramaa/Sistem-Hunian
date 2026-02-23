

# Enhanced Scrollbar untuk Sidebar & Content

Menambahkan custom scrollbar styling yang modern, konsisten, dan compatible dengan semua browser (Chrome, Firefox, Safari, Edge).

---

## Pendekatan

### 1. Tambah Custom Scrollbar CSS di `src/index.css`

Menambahkan utility classes dan global scrollbar styles:

- **`.custom-scrollbar`** -- Scrollbar tipis dengan warna tema, hover reveal
- **`.custom-scrollbar-dark`** -- Varian untuk sidebar (dark background)
- Menggunakan **3 metode** untuk kompatibilitas penuh:
  - `scrollbar-width` + `scrollbar-color` (Firefox / standard)
  - `::-webkit-scrollbar` (Chrome, Safari, Edge)
  - `@supports` fallback

### 2. Update `SidebarContent` di `sidebar.tsx`

Menambahkan class `custom-scrollbar-dark` pada `SidebarContent` yang saat ini menggunakan `overflow-auto` tanpa styling.

### 3. Update `ScrollArea` di `scroll-area.tsx`

Enhance `ScrollAreaThumb` dengan warna yang lebih visible, hover state, dan transisi smooth.

### 4. Update `SidebarInset` di `sidebar.tsx`

Menambahkan `custom-scrollbar` class pada main content area agar scrollbar di halaman konten juga ter-style.

---

## Detail Teknis

### File yang diubah

| File | Perubahan |
|------|-----------|
| `src/index.css` | Tambah `.custom-scrollbar` dan `.custom-scrollbar-dark` utility classes dengan webkit + Firefox support |
| `src/shared/components/ui/sidebar.tsx` | Tambah `custom-scrollbar-dark` ke `SidebarContent`, tambah `custom-scrollbar` ke `SidebarInset` |
| `src/shared/components/ui/scroll-area.tsx` | Enhance thumb styling dengan hover state dan warna lebih visible |

### CSS yang ditambahkan

```css
/* Light content scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: hsl(var(--border)); 
  border-radius: 9999px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: hsl(var(--muted-foreground) / 0.5); 
}

/* Dark sidebar scrollbar */
.custom-scrollbar-dark {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--sidebar-border)) transparent;
}
/* ... webkit equivalents for dark variant */
```

### ScrollArea Thumb Enhancement

- Dari: `bg-border`
- Ke: `bg-border/60 hover:bg-border transition-colors duration-150`
- Lebih subtle saat idle, lebih visible saat hover

