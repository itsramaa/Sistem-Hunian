import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { UserRole, navigationConfig } from "@/shared/components/sidebar/navigation-config";

interface SearchCommandProps {
  role: UserRole;
}

export function SearchCommand({ role }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const config = navigationConfig[role];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 px-3 py-1.5 h-8 text-sm text-muted-foreground hover:text-foreground hover:bg-card/90 transition-all"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/40 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari halaman atau fitur..." />
        <CommandList>
          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
          {config.mainNav.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.path}`}
                  onSelect={() => handleSelect(item.path)}
                  className="gap-2 rounded-lg"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground/60 truncate max-w-[120px]">
                    {item.path}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
