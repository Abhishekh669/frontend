const stats = [
  { num: "800+", label: "Restaurants in Nepal" },
  { num: "12M+", label: "Orders Processed" },
  { num: "99.8%", label: "System Uptime" },
  { num: "4.8★", label: "Customer Rating" },
];

export default function Stats() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Gold rule */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-14" />

        {/* Centered label */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            नेपालमा DineX — DineX Across Nepal
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="group">
              <div className="text-4xl sm:text-5xl font-black text-accent leading-none mb-2 group-hover:scale-105 transition-transform duration-200">
                {s.num}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gold rule */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mt-14" />
      </div>
    </section>
  );
}