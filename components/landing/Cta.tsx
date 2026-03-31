export default function CTA() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl border border-border bg-card px-6 sm:px-12 py-16 shadow-sm max-w-3xl mx-auto overflow-hidden text-center">

          {/* Glow top-right */}
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, oklch(0.75 0.12 85) 0%, transparent 70%)",
              opacity: 0.12,
            }}
          />
          {/* Glow bottom-left */}
          <div
            className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, oklch(0.75 0.12 85) 0%, transparent 70%)",
              opacity: 0.07,
            }}
          />

          {/* Gold top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

          <div className="relative z-10">
            {/* Made in Nepal badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-muted/60 mb-6">
              <span className="text-sm">🇳🇵</span>
              <span className="text-xs font-semibold text-foreground">
                Made in Nepal, for Nepal
              </span>
              <span className="text-sm">❤️</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
              Ready to modernize your{" "}
              <span className="text-accent">restaurant?</span>
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
              Join 800+ Nepali restaurants using DineX. Start free,
              no credit card required. Our team will help you set up.
            </p>

            <a
              href="#"
              className="inline-flex items-center justify-center h-12 px-9 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/85 active:scale-[0.98] rounded-xl transition-all shadow-md"
            >
              Start Your Free 14-day Trial
            </a>

            <p className="text-xs text-muted-foreground mt-4">
              No credit card · Free to start · Cancel anytime · Nepali support
            </p>

            {/* Student pride note */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                🎓 DineX is proudly built by Nepali students — designed to empower Nepali restaurant owners with technology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}