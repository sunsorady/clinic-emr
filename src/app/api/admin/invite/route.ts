import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../../lib/supabaseServer";


export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "doctor").trim().toLowerCase();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const allowed = new Set(["admin", "doctor", "nurse", "reception"]);
    if (!allowed.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) return NextResponse.json({ error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

    const supabaseAdmin = createClient(url, serviceKey);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const userId = data.user?.id;
    if (!userId) return NextResponse.json({ error: "Invite succeeded but no user id" }, { status: 500 });

    const { error: upsertError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email, role }, { onConflict: "id" });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

    return NextResponse.json({ ok: true, userId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error", where: "api/admin/invite" }, { status: 500 });
  }
}
