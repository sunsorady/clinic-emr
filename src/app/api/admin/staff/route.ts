import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../../lib/supabaseServer";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SERVICE exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const cookieStore = await cookies();
    console.log("cookies count:", cookieStore.getAll().length);

    // Identify caller via session cookie
    const supabase = await supabaseServer();
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check caller role
    const { data: callerProfile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message, where: "profiles role check" }, { status: 400 });
    }

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    // Service role client (bypasses RLS) for full staff list
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) return NextResponse.json({ error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

    const admin = createClient(url, serviceKey);

    const { data, error } = await admin
      .from("profiles")
      .select("id,email,full_name,role,created_at,last_seen")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, where: "profiles list" }, { status: 400 });
    }

    return NextResponse.json({ staff: data || [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error", where: "api/admin/staff GET" },
      { status: 500 }
    );
  }
}
