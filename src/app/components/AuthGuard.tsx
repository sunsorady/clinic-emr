"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      const { data } = await supabase.auth.getSession();

      // Not logged in + trying to access dashboard → go to login
      if (!data.session && pathname.startsWith("/dashboard")) {
        router.replace("/");
        return;
      }

      if (alive) setReady(true);
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname.startsWith("/dashboard")) {
        router.replace("/");
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!ready) return null;

  return <>{children}</>;
}
