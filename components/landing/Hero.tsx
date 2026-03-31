import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";

const proofBadges = [
  "Free 14-day Trial",
  "No Credit Card Needed",
  "Nepali Support Team",
];

const trusted = [
  { city: "Kathmandu", count: "400+" },
  { city: "Pokhara", count: "180+" },
  { city: "Chitwan", count: "120+" },
  { city: "Butwal", count: "90+" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[93vh] flex items-center overflow-hidden">

      {/* === BACKGROUND LAYERS === */}

      {/* Soft lavender-to-ivory gradient, like RestroX */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(145deg, color-mix(in oklch, var(--accent) 6%, var(--background)) 0%, var(--background) 55%, color-mix(in oklch, var(--accent) 3%, var(--background)) 100%)",
        }}
      />

      {/* Top-right warm radial glow */}
      <div
        className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.12 85) 0%, transparent 68%)",
          opacity: 0.11,
        }}
      />
      {/* Bottom-left subtle glow */}
      <div
        className="absolute bottom-0 -left-16 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.12 85) 0%, transparent 70%)",
          opacity: 0.05,
        }}
      />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />

      {/* === CONTENT === */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT: Copy */}
          <div>

            {/* Trust badge pill */}
            <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full border border-border bg-card/80 shadow-sm">
              <span className="text-base">🇳🇵</span>
              <span className="text-xs font-semibold text-foreground tracking-wide">
                Nepal&apos;s Trusted Restaurant POS
              </span>
            </div>

            {/* Main headline — mirrors RestroX layout */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.06] text-foreground mb-5">
              Best{" "}
              <span className="text-accent">Restaurant</span>{" "}
              Management
              <br />
              <span className="text-accent">Software</span>{" "}
              in Nepal
            </h1>

            {/* Sub-copy */}
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-[500px] mb-8">
              With <span className="font-bold text-foreground">DineX</span>, manage all your restaurant
              operations — orders, menu, staff, inventory, and finance —
              all from one simple system, built for Nepal.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/85 active:scale-[0.98] rounded-xl transition-all shadow-md"
              >
                Start a 14-day Free Trial
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium border border-border bg-transparent hover:bg-muted rounded-xl transition-colors"
              >
                Login to Dashboard
              </Link>
            </div>

            {/* Proof items */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10">
              {proofBadges.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                  {b}
                </span>
              ))}
            </div>

            {/* City presence strip */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">
                Restaurants in:
              </span>
              {trusted.map((t, i) => (
                <span key={t.city} className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-foreground">
                    {t.city}
                  </span>
                  <span className="text-[11px] text-accent font-semibold">
                    {t.count}
                  </span>
                  {i < trusted.length - 1 && (
                    <span className="text-muted-foreground/40 mx-0.5">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT: Dashboard mockup */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow ring behind card */}
            <div
              className="absolute inset-[-20px] rounded-3xl pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 60% 40%, oklch(0.75 0.12 85) 0%, transparent 65%)",
                opacity: 0.08,
              }}
            />

            <div
              className="relative w-full max-w-[430px] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
              style={{ animation: "dinexFloat 6s ease-in-out infinite" }}
            >
              {/* Card top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-accent/20 flex items-center justify-center">
                      <span className="text-[13px]">🍽️</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">DineX Dashboard</div>
                      <div className="text-[10px] text-muted-foreground">Today — Real-time</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-600">Live</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { emoji: "💰", val: "Rs. 48,200", label: "Today's Sales", color: "text-amber-500 bg-amber-500/10" },
                    { emoji: "🛒", val: "164", label: "Orders", color: "text-blue-500 bg-blue-500/10" },
                    { emoji: "🪑", val: "18/24", label: "Tables", color: "text-emerald-500 bg-emerald-500/10" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border bg-muted/40 p-3 text-center">
                      <div className={`w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center text-sm ${s.color}`}>
                        {s.emoji}
                      </div>
                      <div className="text-xs font-black text-foreground leading-none mb-0.5">{s.val}</div>
                      <div className="text-[9px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Active orders list */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Active Orders
                    </span>
                    <span className="text-[10px] text-accent font-semibold">View all</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { table: "Table 3", item: "Momo, Dal Bhat, Lassi", status: "Preparing", dot: "bg-amber-400" },
                      { table: "Table 7", item: "Chowmein, Thukpa", status: "Ready", dot: "bg-emerald-500" },
                      { table: "Table 1", item: "Buff Sekuwa, Aila", status: "Serving", dot: "bg-blue-500" },
                      { table: "Delivery #12", item: "Pizza, Cold Drink", status: "On the way", dot: "bg-violet-500" },
                    ].map((o) => (
                      <div
                        key={o.table}
                        className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${o.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-foreground">{o.table}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{o.item}</div>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground shrink-0">{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue bar */}
                <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Daily Target</span>
                    <span className="text-[10px] font-bold text-foreground">Rs. 48,200 / 60,000</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-[80%] rounded-full bg-accent" />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">80% of target reached 🎯</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dinexFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}