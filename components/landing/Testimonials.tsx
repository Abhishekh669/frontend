const testimonials = [
  {
    quote:
      "DineX le hamro restaurant ko sab kuch easy banayo. Order management dekhi billing samma — sab ek thau ma. Hamro staff le chai din 1 mai sikyo.",
    quoteEn:
      "DineX made everything in our restaurant easy. From order management to billing — all in one place. Our staff learned it in just one day.",
    name: "Bikash Shrestha",
    role: "Owner, Thamel Kitchen · Kathmandu",
    init: "BS",
    clr: "bg-amber-500/20 text-amber-700",
  },
  {
    quote:
      "Pahile hami notebook ma order liuthinchau — gajab galbedi hunchyo. DineX aayepachi kitchen display le sab thik garyo. Sales pani badhyo!",
    quoteEn:
      "We used to take orders in a notebook — lots of mistakes. After DineX, the kitchen display fixed everything. Sales also increased!",
    name: "Sunita Gurung",
    role: "Manager, Lakeside Dine · Pokhara",
    init: "SG",
    clr: "bg-blue-500/20 text-blue-700",
  },
  {
    quote:
      "Student haru le banayako software bhane pani ekdam professional xa. Support team Nepali ma bolcha — त्यो कुरा मलाई धेरै मन पर्यो।",
    quoteEn:
      "Even though it's made by students, it's very professional. The support team speaks in Nepali — I loved that about it.",
    name: "Raju Tamang",
    role: "Chef-Owner, Momo Palace · Chitwan",
    init: "RT",
    clr: "bg-emerald-500/20 text-emerald-700",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            ग्राहकहरूको आवाज — Customer Stories
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center text-foreground mb-3">
          Real restaurants,{" "}
          <span className="text-accent">real results</span>
        </h2>
        <p className="text-center text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-12">
          Hear from restaurant owners across Nepal who run their businesses with DineX every day.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Flag + quote marks */}
              <div className="flex items-center justify-between">
                <span className="text-lg">🇳🇵</span>
                <span className="text-2xl text-accent/30 font-black leading-none">&ldquo;</span>
              </div>

              {/* Nepali quote */}
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                {t.quote}
              </p>

              {/* English translation */}
              <p className="text-xs text-muted-foreground/70 leading-relaxed border-l-2 border-accent/30 pl-3">
                {t.quoteEn}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1">
                <div
                  className={`w-9 h-9 rounded-xl border border-border flex items-center justify-center text-xs font-black shrink-0 ${t.clr}`}
                >
                  {t.init}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}