import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { listApkReleases, downloadApkUrl } from '@/lib/github-apk.functions';

const fmtSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function ResellerApps() {
  const fetchReleases = useServerFn(listApkReleases);
  const getDownloadUrl = useServerFn(downloadApkUrl);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['apk-releases'],
    queryFn: () => fetchReleases(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const releases = data?.releases ?? [];

  const handleDownload = async (assetUrl: string, name: string) => {
    try {
      const res = await getDownloadUrl({ data: { assetUrl } });
      if (!res.url) throw new Error('no url');
      window.open(res.url, '_blank', 'noopener');
    } catch {
      toast.error(`Lama soo dejin karin ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" /> Apps
          </h2>
          <p className="text-sm text-muted-foreground">
            APK-yada GitHub Actions dhisay si otomaatig ah halkan ayay uga soo muuqdaan.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Cusboonaysii
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {(isError || data?.error) && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {data?.error ?? 'Lama soo saari karin liiska APK-yada.'}
          </CardContent>
        </Card>
      )}

      {!isLoading && !data?.error && releases.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Weli APK lama dhisin. Marka workflow-ka "Build Android APK" uu dhammaado, APK-gu
            halkan ayuu si otomaatig ah uga soo muuqan doonaa.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {releases.map((rel) => (
          <Card key={rel.tag}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="truncate">{rel.name}</span>
                <Badge variant={rel.prerelease ? 'secondary' : 'default'}>
                  {rel.prerelease ? 'Debug' : 'Release'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{fmtDate(rel.publishedAt)}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {rel.assets.map((a) => (
                <button
                  key={a.name}
                  onClick={() => handleDownload(a.url, a.name)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtSize(a.size)}</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-primary" />
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
