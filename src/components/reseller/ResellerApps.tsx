import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';

const REPO = 'Tabid123/remix-of-iftin-resseller-sax-ah';

interface GhAsset {
  name: string;
  browser_download_url: string;
  size: number;
  updated_at: string;
}

interface GhRelease {
  tag_name: string;
  name: string | null;
  prerelease: boolean;
  published_at: string;
  html_url: string;
  assets: GhAsset[];
}

const fmtSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function ResellerApps() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['github-apk-releases'],
    queryFn: async (): Promise<GhRelease[]> => {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error('GitHub API error');
      return res.json();
    },
    staleTime: 60_000,
  });

  const releases = (data ?? []).filter((r) => r.assets.some((a) => a.name.endsWith('.apk')));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" /> Apps
          </h2>
          <p className="text-sm text-muted-foreground">
            APK-yada GitHub Actions ku dhisay halkan ka soo deji.
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

      {isError && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Lama soo saari karin liiska APK-yada. Fadlan mar kale isku day.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && releases.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Weli APK lama dhisin. Ku dhis GitHub Actions (workflow: Build Android APK), kadibna
            halkan ayuu ka soo muuqan doonaa.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {releases.map((rel) => (
          <Card key={rel.tag_name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="truncate">{rel.name || rel.tag_name}</span>
                <Badge variant={rel.prerelease ? 'secondary' : 'default'}>
                  {rel.prerelease ? 'Debug' : 'Release'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{fmtDate(rel.published_at)}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {rel.assets
                .filter((a) => a.name.endsWith('.apk'))
                .map((a) => (
                  <a
                    key={a.name}
                    href={a.browser_download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtSize(a.size)}</p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-primary" />
                  </a>
                ))}
              <a
                href={rel.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-primary hover:underline"
              >
                GitHub release ka eeg
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
