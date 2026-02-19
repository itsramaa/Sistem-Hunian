import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { Clock, Search, X, Trash2 } from "lucide-react";
import { cn } from "@/shared/utils/utils";

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
}

interface MarketplaceSearchHistoryProps {
  onSearch: (query: string) => void;
  maxItems?: number;
  className?: string;
}

const STORAGE_KEY = "marketplace_search_history";

export function MarketplaceSearchHistory({
  onSearch,
  maxItems = 10,
  className,
}: MarketplaceSearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const addToHistory = (query: string, resultCount?: number) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newItem: SearchHistoryItem = {
      id: crypto.randomUUID(),
      query: trimmedQuery,
      timestamp: new Date(),
      resultCount,
    };

    // Remove duplicate and add to front
    const filtered = history.filter(
      (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
    );
    const newHistory = [newItem, ...filtered].slice(0, maxItems);
    saveHistory(newHistory);
  };

  const removeFromHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const handleSearch = (query: string) => {
    onSearch(query);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID");
  };

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = showAll ? history : history.slice(0, 5);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Riwayat Pencarian</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={clearHistory}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Hapus Semua
        </Button>
      </div>

      {/* Horizontal scroll for mobile */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {displayedHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 shrink-0 group"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 pr-1"
                onClick={() => handleSearch(item.query)}
              >
                <Search className="h-3 w-3 mr-1.5 text-muted-foreground" />
                <span className="max-w-[150px] truncate">{item.query}</span>
                {item.resultCount !== undefined && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.resultCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFromHistory(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Show more/less */}
      {history.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Tampilkan Lebih Sedikit" : `Lihat ${history.length - 5} lainnya`}
        </Button>
      )}

      {/* Detailed list view for desktop */}
      {showAll && (
        <div className="hidden md:block space-y-2 pt-2 border-t">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
            >
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => handleSearch(item.query)}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.query}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.timestamp)}
                    {item.resultCount !== undefined && ` • ${item.resultCount} hasil`}
                  </p>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => removeFromHistory(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Export hook for adding to history from search component
export function useSearchHistory() {
  const addToHistory = (query: string, resultCount?: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: SearchHistoryItem[] = [];
    
    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch {
        history = [];
      }
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newItem: SearchHistoryItem = {
      id: crypto.randomUUID(),
      query: trimmedQuery,
      timestamp: new Date(),
      resultCount,
    };

    const filtered = history.filter(
      (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
    );
    const newHistory = [newItem, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  return { addToHistory };
}
