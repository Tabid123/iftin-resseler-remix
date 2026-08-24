import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Wallet } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ProviderRow {
  id: string;
  provider_name: string;
  provider_logo: string | null;
  is_active: boolean;
  payment_number: string | null;
  out_of_balance: boolean;
}

const ORDER = ['hormuud', 'somnet', 'somtel', 'amtel'];

export default function ResellerProviders() {
  const { currentTenantId } = useTenant();
  const [items, setItems] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [numbers, setNumbers] = useState<Record<string, string>>({});

  const load = async () => {
    if (!currentTenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('providers_config')
      .select('id, provider_name, provider_logo, is_active, payment_number, out_of_balance')
      .eq('tenant_id', currentTenantId);
    if (error) toast({ title: 'Khalad', description: error.message, variant: 'destructive' });
    const rows = ((data as ProviderRow[]) ?? []).sort((a, b) => {
      const ia = ORDER.indexOf(a.provider_name?.toLowerCase());
      const ib = ORDER.indexOf(b.provider_name?.toLowerCase());
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    setItems(rows);
    setNumbers(Object.fromEntries(rows.map((r) => [r.id, r.payment_number ?? ''])));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currentTenantId]);

  const patch = async (row: ProviderRow, changes: Partial<ProviderRow>, message: string) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from('providers_config')
      .update(changes)
      .eq('id', row.id)
      .eq('tenant_id', currentTenantId);
    setSavingId(null);
    if (error) { toast({ title: 'Khalad', description: error.message, variant: 'destructive' }); return; }
    setItems((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...changes } : p)));
    toast({ title: 'Guul', description: message });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Shirkadaha</h2>
        <p className="text-sm text-muted-foreground">
          Shirkad walba shid/dami, lambar lacag u deji, ama u calaamadi "Balance ma heyno".
        </p>
      </div>

      {items.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Shirkad lama helin.</CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id} className={p.is_active ? '' : 'opacity-70'}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div className="flex items-center gap-3">
                {p.provider_logo ? (
                  <img src={p.provider_logo} alt={`${p.provider_name} logo`} className="h-10 w-10 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold uppercase">
                    {p.provider_name?.slice(0, 3)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-base capitalize">{p.provider_name}</CardTitle>
                  {p.out_of_balance && (
                    <Badge variant="destructive" className="mt-1">Balance ma heyno</Badge>
                  )}
                </div>
              </div>
              <Switch
                checked={p.is_active}
                disabled={savingId === p.id}
                onCheckedChange={(v) => patch(p, { is_active: v }, v ? 'Shirkadda waa la shiday' : 'Shirkadda waa la damiyay')}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`num-${p.id}`}>Lambarka lacagta</Label>
                <div className="flex gap-2">
                  <Input
                    id={`num-${p.id}`}
                    inputMode="tel"
                    placeholder="617195659"
                    value={numbers[p.id] ?? ''}
                    onChange={(e) => setNumbers((n) => ({ ...n, [p.id]: e.target.value }))}
                  />
                  <Button
                    onClick={() => patch(p, { payment_number: (numbers[p.id] ?? '').trim() || null }, 'Lambarka lacagta waa la kaydiyay')}
                    disabled={savingId === p.id || (numbers[p.id] ?? '') === (p.payment_number ?? '')}
                  >
                    <Save className="mr-2 h-4 w-4" /> Kaydi
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Balance ma heyno</p>
                    <p className="text-xs text-muted-foreground">Macaamiisha waa loo sheegayaa in balance-ku dhamaaday.</p>
                  </div>
                </div>
                <Switch
                  checked={p.out_of_balance}
                  disabled={savingId === p.id}
                  onCheckedChange={(v) => patch(p, { out_of_balance: v }, v ? 'Waa la calaamadiyay "Balance ma heyno"' : 'Balance-ka waa la celiyay')}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
