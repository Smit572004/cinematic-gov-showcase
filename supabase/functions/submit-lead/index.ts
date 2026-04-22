// Edge function: receives lead from Instagram landing page, stores in DB, optionally emails admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_EMAIL = "smit62622@gmail.com";

interface LeadBody {
  full_name?: string;
  email?: string;
  phone?: string;
  referrer?: string;
  user_agent?: string;
  language?: string;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as LeadBody;
    const full_name = (body.full_name ?? "").toString().trim().slice(0, 120);
    const email = (body.email ?? "").toString().trim().toLowerCase().slice(0, 255);
    const phone = (body.phone ?? "").toString().trim().slice(0, 50);

    if (!full_name || full_name.length < 2) {
      return new Response(JSON.stringify({ error: "Bitte gib deinen Namen an." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isEmail(email)) {
      return new Response(JSON.stringify({ error: "Ungültige E-Mail-Adresse." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (phone.length < 5) {
      return new Response(JSON.stringify({ error: "Bitte gib deine Telefonnummer an." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        full_name,
        email,
        phone,
        source: "instagram-landing",
        referrer: (body.referrer ?? "").toString().slice(0, 500) || null,
        user_agent: (body.user_agent ?? req.headers.get("user-agent") ?? "").toString().slice(0, 500) || null,
        language: (body.language ?? "").toString().slice(0, 10) || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Lead insert failed:", error);
      return new Response(JSON.stringify({ error: "Speichern fehlgeschlagen." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional email notification via Resend connector (only if configured)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (lovableKey && resendKey) {
      try {
        const html = `
          <h2>Neuer Lead von Instagram-Landingpage</h2>
          <p><b>Name:</b> ${full_name}</p>
          <p><b>E-Mail:</b> ${email}</p>
          <p><b>Telefon:</b> ${phone}</p>
          <p><b>Sprache:</b> ${lead.language ?? "-"}</p>
          <p><b>Referrer:</b> ${lead.referrer ?? "-"}</p>
          <p style="color:#888;font-size:12px">Lead-ID: ${lead.id}</p>
        `;
        const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": resendKey,
          },
          body: JSON.stringify({
            from: "TinPlant Leads <onboarding@resend.dev>",
            to: [NOTIFY_EMAIL],
            subject: `🌱 Neuer Lead: ${full_name}`,
            html,
          }),
        });
        if (!resp.ok) {
          console.warn("Resend notification failed:", resp.status, await resp.text());
        }
      } catch (e) {
        console.warn("Resend notification error:", e);
      }
    } else {
      console.log("Resend not configured — skipping email notification. Lead saved:", lead.id);
    }

    return new Response(JSON.stringify({ ok: true, id: lead.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-lead error:", e);
    return new Response(JSON.stringify({ error: "Server-Fehler." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
