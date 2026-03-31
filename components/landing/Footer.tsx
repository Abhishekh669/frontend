import Link from "next/link";

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About Us", "Blog", "Careers", "Press Kit"],
  Support: ["Documentation", "Contact Us", "WhatsApp Help", "Training Videos"],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row gap-10 justify-between mb-10">

          {/* Brand block */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center shadow-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* <img
                  src="/logo.png"
                  alt="DineX"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                /> */}
              </div>
              <div className="leading-none">
                <div className="text-base font-black text-foreground tracking-tight">DineX</div>
                <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Nepal</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Nepal&apos;s most trusted restaurant management software.
              Built by Nepali students, for Nepali businesses.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">📍 Kathmandu, Nepal</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground">📞 +977-98XXXXXXXX</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {heading}
                </h4>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DineX Pvt. Ltd. · Kathmandu, Nepal · All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ by Nepali students 🇳🇵
          </p>
        </div>
      </div>
    </footer>
  );
}