"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";


export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard/patients");
  }

  return (
    <main className="login">
      <div className="bgImage" aria-hidden="true" />
      <div className="bgTint" aria-hidden="true" />

      <section className="card" role="dialog" aria-label="Clinic EMR login">
        <div className="header">
          <div className="logoWrap">
            <img
              className="logo"
              src="/logo/logo.png"
              alt="Clinic logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fallback = document.getElementById("logoFallback");
                if (fallback) fallback.style.display = "grid";
              }}
              onLoad={() => {
                const fallback = document.getElementById("logoFallback");
                if (fallback) fallback.style.display = "none";
              }}
            />

            <div
              id="logoFallback"
              className="logoFallback"
              aria-hidden="true"
              style={{ display: "none" }}
            >
              +
            </div>
          </div>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label" htmlFor="email">
            Email Address
          </label>
          <div className="inputWrap">
            <span className="icon" aria-hidden="true">
              ✉
            </span>
            <input
              id="email"
              className="input"
              placeholder="doctor@clinic.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="row">
            <label className="label" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              className="link"
              onClick={() => alert("Later: connect to password reset")}
            >
              Forgot password?
            </button>
          </div>

          <div className="inputWrap">
            <span className="icon" aria-hidden="true">
              🔒
            </span>
            <input
              id="password"
              className="input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="muted center">Authorized staff only</p>

          <div className="pill">
            <span className="dot" aria-hidden="true" />
            <span>Secure • Invite-only access</span>
          </div>

          <div className="footerKhmer">
            <p className="khmer text-sm text-gray-500">
              © ២០២៦ រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ នភាល័យ
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
