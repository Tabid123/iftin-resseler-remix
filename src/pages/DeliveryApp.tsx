import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Smartphone,
  Signal,
} from "lucide-react";

interface SessionProvider {
  id: string;
  name: string;
  ussd_method: string | null;
  sim_pin: string | null;
}

interface DeliverySession {
  authenticated: boolean;
  tenant_id: string | null;
  tenant_slug?: string;
  tenant_name?: string;
  providers?: SessionProvider[];
}

interface QueueItem {
  id: string;
  provider_name: string;
  status: string;
  phone_number: string | null;
  package_name: string | null;
  created_at: string;
}

export default function DeliveryApp() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // session data
  const [session, setSession] = useState<DeliverySession | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_delivery_session" as any);
      if (error) throw error;
      const s = (data ?? null) as unknown as DeliverySession | null;
      setSession(s);

      if (s?.tenant_id) {
        const { data: q } = await supabase
          .from("delivery_queue")
          .select("id, provider_name, status, phone_number, package_name, created_at")
          .eq("tenant_id", s.tenant_id)
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: true })
          .limit(25);
        setQueue((q ?? []) as unknown as QueueItem[]);
      } else {
        setQueue([]);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Lama heli karo delivery session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
      setChecking(false);
      if (data.session) loadSession();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSignedIn(!!s);
      if (s) loadSession();
      else {
        setSession(null);
        setQueue([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadSession]);

  useEffect(() => {
    if (!signedIn) return;
    const t = setInterval(loadSession, 20000);
    return () => clearInterval(t);
  }, [signedIn, loadSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Waa lagu soo dhaweeyay");
    } catch (err: any) {
      toast.error(err?.message ?? "Email ama password khalad ah");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Waa laga baxay");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Delivery App Login</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ku gal email-ka iyo password-ka shirkaddaada
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPass ? "Qari password" : "Muuji password"}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Gal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const providers = session?.providers ?? [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {session?.tenant_name ?? "Delivery App"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {session?.tenant_slug ? `@${session.tenant_slug}` : "Delivery session"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadSession} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {session && !session.tenant_id && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Akoonkan shirkad lama xirin. La xiriir admin-ka si laguugu daro tenant-ka.
            </CardContent>
          </Card>
        )}

        {providers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" /> SIM PIN & Providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.ussd_method ?? "interactive"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {p.sim_pin
                        ? showPins[p.id]
                          ? p.sim_pin
                          : "••••"
                        : "—"}
                    </code>
                    {p.sim_pin && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPins((s) => ({ ...s, [p.id]: !s[p.id] }))
                        }
                        className="text-muted-foreground"
                        aria-label="Muuji PIN"
                      >
                        {showPins[p.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Signal className="h-4 w-4" /> Dalabyada sugaya
              <Badge variant="secondary">{queue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Dalab sugaya ma jiro.</p>
            ) : (
              queue.map((q) => (
                <div key={q.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{q.provider_name}</span>
                    <Badge
                      variant={q.status === "processing" ? "default" : "secondary"}
                    >
                      {q.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {q.phone_number ?? "—"} · {q.package_name ?? ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
