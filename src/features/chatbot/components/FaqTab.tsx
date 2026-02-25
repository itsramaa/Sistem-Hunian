import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { faqCategories } from "@/pages/merchant/Support";

export function FaqTab() {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {faqCategories.map((cat, catIdx) => (
          <div key={catIdx}>
            <div className="flex items-center gap-2 mb-2">
              <cat.icon className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">{cat.category}</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1">
              {cat.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${catIdx}-${i}`}
                  className="rounded-lg border border-border/40 bg-card/80 px-3 data-[state=open]:bg-primary/5"
                >
                  <AccordionTrigger className="text-xs font-medium hover:no-underline py-2">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground pb-3">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
