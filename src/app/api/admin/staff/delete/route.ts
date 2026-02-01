import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = await supabaseServer();

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerId = authData.user.id;

    if (callerId === userId) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const { data: callerProfile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) return NextResponse.json({ error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

    const admin = createClient(url, serviceKey);

    // Optional: block deleting another admin
    const { data: targetProfile } = await admin.from("profiles").select("role").eq("id", userId).single();
    if (targetProfile?.role === "admin") {
      return NextResponse.json({ error: "Cannot delete another admin." }, { status: 403 });
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
