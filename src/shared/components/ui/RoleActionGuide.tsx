import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Button } from '@/shared/components/ui/button';
import { getActionsForRole, type RoleAction } from '@/shared/constants/role-actions';
import { useState } from 'react';

interface RoleActionGuideProps {
  role: string;
}

export function RoleActionGuide({ role }: RoleActionGuideProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const actions = getActionsForRole(role);

  if (actions.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-2xl pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <HelpCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Apa yang bisa Anda lakukan?</CardTitle>
                <p className="text-xs text-muted-foreground">{actions.length} aksi utama</p>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {actions.map((action: RoleAction) => (
              <div
                key={action.label}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all cursor-pointer border border-transparent hover:border-border/40"
                onClick={() => navigate(action.path)}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
