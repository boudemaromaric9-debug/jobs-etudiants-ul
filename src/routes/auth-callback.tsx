import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const hash = localStorage.getItem("supabase_oauth_hash") || window.location.hash;
localStorage.removeItem("supabase_oauth_hash");

    console.log("Hash reçu:", hash);

    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
      const access_token = params.get("access_token") || "";
      const refresh_token = params.get("refresh_token") || "";
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
        console.log("Session:", data?.session?.user?.email, error?.message);
        if (data?.session) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/auth";
        }
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/auth";
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center text-white">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
        <p>Connexion en cours...</p>
      </div>
    </div>
  );
}