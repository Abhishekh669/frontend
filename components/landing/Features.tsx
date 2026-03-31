import {
  ClipboardList,
  ChefHat,
  Users,
  BarChart3,
  Truck,
  ShieldCheck,
  Smartphone,
  Headphones,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    cls: "text-blue-500 bg-blue-500/10",
    title: "Menu & Order Management",
    desc: "Create digital menus with categories, combos, and modifiers. Accept table, counter, and delivery orders in one place.",
  },
  {
    icon: ChefHat,
    cls: "text-emerald-500 bg-emerald-500/10",
    title: "Kitchen Display System",
    desc: "Orders go directly to the kitchen screen. Chefs see priority queues, reducing miscommunication and food delays.",
  },
  {
    icon: Users,
    cls: "text-amber-500 bg-amber-500/10",
    title: "Staff Role Management",
    desc: "Separate logins for admins, managers, cashiers, waiters, and delivery staff — each seeing only what they need.",
  },
  {
    icon: BarChart3,
    cls: "text-violet-500 bg-violet-500/10",
    title: "Sales & Finance Reports",
    desc: "Daily, weekly, and monthly sales breakdowns. VAT-ready reports designed for Nepal's billing requirements.",
  },
  {
    icon: Truck,
    cls: "text-rose-500 bg-rose-500/10",
    title: "Delivery Tracking",
    desc: "Assign delivery orders to riders and track status from dispatch to doorstep — integrated with your POS.",
  },
  {
    icon: ShieldCheck,
    cls: "text-teal-500 bg-teal-500/10",
    title: "Secure & Reliable",
    desc: "Your data is encrypted and backed up daily. Works offline too — internet hiccups won't stop your service.",
  },
  {
    icon: Smartphone,
    cls: "text-orange-500 bg-orange-500/10",
    title: "Works on Any Device",
    desc: "Use DineX on a tablet, laptop, or phone. No expensive hardware — works on devices you already own.",
  },
  {
    icon: Headphones,
    cls: "text-sky-500 bg-sky-500/10",
    title: "Nepali Support Team",
    desc: "Call or chat with our Kathmandu-based support team in Nepali or English. We're here when you need us.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            सुविधाहरू — Features
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center text-foreground mb-3">
          Everything your restaurant{" "}
          <span className="text-accent">needs</span>
        </h2>
        <p className="text-center text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-14">
          From a small momo shop in Thamel to a multi-branch hotel in Pokhara —
          DineX adapts to your scale and budget.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border bg-card px-5 py-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden"
              >
                {/* Top shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent group-hover:via-accent/70 transition-all duration-300" />

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.cls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5 leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}