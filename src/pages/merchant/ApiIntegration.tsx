import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useWebhooks, useCreateWebhook, useDeleteWebhook, useWebhookLogs } from '@/features/integrations/hooks/useApiIntegration';
import { WEBHOOK_EVENTS } from '@/features/integrations/services/apiIntegrationService';
import { ScanText, Key, Webhook, BookOpen, Copy, Trash2, Plus, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatLabel } from '@/shared/utils/utils';

export default function ApiIntegration() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  return (
    <div className="space-y-6">
      <PageHeader icon={ScanText} title="API & Integrasi" description="Kelola API key, webhook, dan lihat dokumentasi API." />
      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-1.5"><Key className="h-4 w-4" />API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5"><Webhook className="h-4 w-4" />Webhooks</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1.5"><BookOpen className="h-4 w-4" />Dokumentasi</TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys"><ApiKeysTab merchantId={merchantId} /></TabsContent>
        <TabsContent value="webhooks"><WebhooksTab merchantId={merchantId} /></TabsContent>
        <TabsContent value="docs"><DocsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysTab({ merchantId }: { merchantId?: string }) {
  const { data: keys, isLoading } = useApiKeys(merchantId);
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!merchantId || !newKeyName.trim()) return;
    const plainKey = await createKey.mutateAsync({ merchantId, name: newKeyName.trim(), scopes: ['read'] });
    setCreatedKey(plainKey);
    setNewKeyName('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      {createdKey && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">API Key baru Anda — salin sekarang, tidak akan ditampilkan lagi!</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted p-2 rounded flex-1 break-all">{createdKey}</code>
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(createdKey); toast.success('Disalin!'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>Tutup</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"><Plus className="h-4 w-4" />Buat API Key</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">API Keys</CardTitle><CardDescription>Key yang aktif untuk mengakses REST API.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Memuat...</p> : !keys?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada API key. Buat satu untuk mulai.</p>
          ) : (
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div>
                    <div className="text-sm font-medium">{k.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{k.key_prefix}</div>
                    <div className="text-xs text-muted-foreground">Scopes: {(k.scopes || []).join(', ')} • Rate: {k.rate_limit}/jam</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!k.is_active ? (
                      <span className="text-xs text-destructive font-medium">Dicabut</span>
                    ) : (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => merchantId && revokeKey.mutate({ id: k.id, merchantId })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Buat API Key Baru</DialogTitle><DialogDescription>Berikan nama untuk identifikasi key ini.</DialogDescription></DialogHeader>
          <Input placeholder="Nama key, mis: Integrasi Accounting" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={!newKeyName.trim() || createKey.isPending}>{createKey.isPending ? 'Membuat...' : 'Buat'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WebhooksTab({ merchantId }: { merchantId?: string }) {
  const { data: webhooks, isLoading } = useWebhooks(merchantId);
  const createWh = useCreateWebhook();
  const deleteWh = useDeleteWebhook();
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [viewLogsId, setViewLogsId] = useState<string | null>(null);
  const { data: logs } = useWebhookLogs(viewLogsId || undefined);

  const handleCreate = async () => {
    if (!merchantId || !url.trim() || !selectedEvents.length) return;
    await createWh.mutateAsync({ merchantId, url: url.trim(), events: selectedEvents });
    setUrl('');
    setSelectedEvents([]);
    setShowCreate(false);
  };

  const toggleEvent = (ev: string) => {
    setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"><Plus className="h-4 w-4" />Tambah Webhook</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Webhook Endpoints</CardTitle><CardDescription>Terima notifikasi event secara real-time.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Memuat...</p> : !webhooks?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada webhook endpoint.</p>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-3 rounded-lg border bg-card/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium font-mono truncate max-w-[300px]">{wh.url}</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewLogsId(wh.id)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => merchantId && deleteWh.mutate({ id: wh.id, merchantId })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map(ev => (
                      <span key={ev} className="text-xs bg-muted px-2 py-0.5 rounded-full">{ev}</span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Failures: {wh.failure_count} {wh.failure_count >= 10 && <span className="text-destructive font-medium">(auto-disabled)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewLogsId && (
        <Card>
          <CardHeader><CardTitle className="text-base">Log Pengiriman</CardTitle></CardHeader>
          <CardContent>
            {!logs?.length ? <p className="text-sm text-muted-foreground">Belum ada log.</p> : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded border text-xs">
                    <span className="font-mono">{log.event_type}</span>
                    <span className={log.response_status && log.response_status < 300 ? 'text-success' : 'text-destructive'}>
                      {log.response_status || 'N/A'}
                    </span>
                    <span className="text-muted-foreground">{new Date(log.delivered_at).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setViewLogsId(null)}>Tutup</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Webhook Endpoint</DialogTitle><DialogDescription>Masukkan URL dan pilih event yang ingin diterima.</DialogDescription></DialogHeader>
          <Input placeholder="https://example.com/webhook" value={url} onChange={e => setUrl(e.target.value)} />
          <div className="space-y-2">
            <p className="text-sm font-medium">Events:</p>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedEvents.includes(ev)} onCheckedChange={() => toggleEvent(ev)} />
                  {formatLabel(ev.replace('.', '_'))}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={!url.trim() || !selectedEvents.length || createWh.isPending}>
              {createWh.isPending ? 'Membuat...' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dokumentasi API</CardTitle>
        <CardDescription>Panduan integrasi REST API dan Webhook.</CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        <h3>Autentikasi</h3>
        <p>Sertakan API key di header setiap request:</p>
        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">{`X-API-Key: pk_live_xxxxxxxxxxxx`}</pre>

        <h3>Endpoints</h3>
        <table className="text-xs">
          <thead><tr><th>Method</th><th>Path</th><th>Deskripsi</th></tr></thead>
          <tbody>
            <tr><td>GET</td><td>/properties</td><td>Daftar properti</td></tr>
            <tr><td>GET</td><td>/properties/:id</td><td>Detail properti + unit</td></tr>
            <tr><td>GET</td><td>/units</td><td>Daftar unit (filter: property_id, status)</td></tr>
            <tr><td>GET</td><td>/tenants</td><td>Daftar penyewa aktif</td></tr>
            <tr><td>GET</td><td>/invoices</td><td>Daftar tagihan (filter: status, date)</td></tr>
            <tr><td>GET</td><td>/payments</td><td>Daftar pembayaran</td></tr>
            <tr><td>GET</td><td>/maintenance</td><td>Daftar maintenance request</td></tr>
            <tr><td>GET</td><td>/contracts</td><td>Daftar kontrak</td></tr>
          </tbody>
        </table>

        <h3>Format Respons</h3>
        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">{`{
  "data": [...],
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}`}</pre>

        <h3>Webhook Events</h3>
        <ul>
          {WEBHOOK_EVENTS.map(ev => <li key={ev}><code>{ev}</code></li>)}
        </ul>

        <h3>Webhook Signature</h3>
        <p>Setiap pengiriman webhook memiliki header <code>X-Webhook-Signature</code> berisi HMAC-SHA256 dari payload menggunakan secret endpoint Anda.</p>

        <h3>Rate Limiting</h3>
        <p>Default: 1000 request/jam per API key. Respons 429 jika limit terlampaui.</p>
      </CardContent>
    </Card>
  );
}
