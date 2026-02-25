import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface PhotoLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

export function PhotoLightbox({ images, initialIndex = 0, open, onClose, alt = 'Foto' }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset when opening or changing image
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [open, initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    resetZoom();
    setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length, resetZoom]);

  const handleNext = useCallback(() => {
    resetZoom();
    setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length, resetZoom]);

  const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.5, 5)), []);
  const zoomOut = useCallback(() => {
    setScale(s => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
      else if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, handlePrev, handleNext, zoomIn, zoomOut, resetZoom]);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }, [zoomIn, zoomOut]);

  // Drag to pan (when zoomed)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - dragStart.current.x),
      y: translateStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pinch zoom
  const lastDistance = useRef<number | null>(null);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (lastDistance.current !== null) {
        const delta = distance - lastDistance.current;
        setScale(s => Math.max(1, Math.min(5, s + delta * 0.005)));
      }
      lastDistance.current = distance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastDistance.current = null;
  }, []);

  if (!open || images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none"
      onClick={(e) => { if (e.target === containerRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Lightbox foto"
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={zoomOut} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="Perkecil">
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white/70 text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="Perbesar">
          <ZoomIn className="h-5 w-5" />
        </button>
        <button onClick={resetZoom} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="Reset zoom">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2" aria-label="Tutup">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 text-white/70 text-sm bg-black/40 rounded-full px-3 py-1">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10" aria-label="Foto sebelumnya">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10" aria-label="Foto selanjutnya">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className={cn("overflow-hidden w-full h-full flex items-center justify-center", isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default')}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-150 pointer-events-none"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 rounded-2xl p-2 max-w-[90vw] overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { resetZoom(); setCurrentIndex(i); }}
              className={cn(
                "h-12 w-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                i === currentIndex ? 'border-white ring-1 ring-white/50' : 'border-transparent opacity-60 hover:opacity-100'
              )}
              aria-label={`Lihat foto ${i + 1}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
