import { useEffect, useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

/**
 * Guards /reseller: only a signed-in user who is owner/admin of a tenant
 * may enter. Platform super admins must use /superadmin instead.
 */
const ResellerRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/reseller/login', { replace: true }); return; }

      const [{ data: membership, error: membershipError }, { data: superRole }] = await Promise.all([
        supabase
          .from('tenant_members')
          .select('member_role, role, tenant_id, tenants(status)')
          .eq('user_id', user.id),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .limit(1)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (superRole) {
        await supabase.auth.signOut();
        toast({
          title: 'Reseller login',
          description: 'Fadlan geli email-ka iyo password-ka reseller-ka.',
          variant: 'destructive',
        });
        navigate('/reseller/login', { replace: true });
        return;
      }

      if (membershipError) {
        toast({
          title: 'Khalad',
          description: 'Xogta reseller-ka lama xaqiijin karin. Fadlan mar kale isku day.',
          variant: 'destructive',
        });
        navigate('/reseller/login', { replace: true });
        return;
      }

      const manager = (membership ?? []).find((m: any) =>
        MANAGER_ROLES.includes(String(m.member_role ?? m.role ?? '').toLowerCase()) &&
        (m.tenants?.status ?? 'active') !== 'suspended'
      );

      if (manager?.tenant_id) {
        localStorage.setItem('active_tenant_id', manager.tenant_id);
        localStorage.removeItem('public_tenant_slug');
        setAllowed(true);
        setChecking(false);
        return;
      }

      toast({
        title: 'Ma lihid fasax',
        description: 'Kaliya maamulaha tenant-ka ayaa geli kara reseller dashboard-ka',
        variant: 'destructive',
      });
      await supabase.auth.signOut();
      navigate('/reseller/login', { replace: true });
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/reseller/login', { replace: true });
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  if (checking || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ResellerRoute;
