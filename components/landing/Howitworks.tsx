const steps = [
  {
    num: "01",
    emoji: "🏪",
    title: "Set Up Your Restaurant",
    desc: "Enter your restaurant details, add your menu items, configure tables and floors. Takes less than 30 minutes.",
  },
  {
    num: "02",
    emoji: "👨‍🍳",
    title: "Invite Your Staff",
    desc: "Add your team with the right roles — chef, waiter, cashier, or manager. Each gets their own login and view.",
  },
  {
    num: "03",
    emoji: "🚀",
    title: "Start Taking Orders",
    desc: "Go live! Accept dine-in, takeaway, and delivery orders. Print bills, track kitchen status, and grow.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--muted) 0%, var(--background) 100%)",
      }}
    >
      {/* Subtle accent blot */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, oklch(0.75 0.12 85) 0%, transparent 70%)",
          opacity: 0.05,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">

        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            सरल सुरुवात — Easy Start
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center text-foreground mb-4">
          Ready in under{" "}
          <span className="text-accent">30 minutes</span>
        </h2>
        <p className="text-center text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-16">
          No technical knowledge needed. Our onboarding is designed for busy
          restaurant owners — not IT professionals.
        </p>

        {/* Steps */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">

          {/* Dashed connector — desktop */}
          <div
            className="hidden sm:block absolute top-8 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] pointer-events-none"
            style={{
              borderTop: "2px dashed color-mix(in oklch, var(--accent) 25%, transparent)",
            }}
          />

          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center relative">

              {/* Step badge */}
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex flex-col items-center justify-center shadow-md z-10 relative">
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background text-[9px] font-black flex items-center justify-center">
                  {i + 1}
                </div>
              </div>

              <h3 className="text-sm font-bold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <div className="mt-14 text-center">
          <a
            href="#"
            className="inline-flex items-center justify-center h-11 px-7 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/85 active:scale-[0.98] rounded-xl transition-all shadow-sm"
          >
            Get Started — आजै सुरु गर्नुहोस्
          </a>
        </div>
      </div>
    </section>
  );
}