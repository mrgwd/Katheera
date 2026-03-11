import {
  Hand,
  WifiOff,
  Lock,
  Zap,
  LayoutGrid,
  Heart,
} from "@workspace/ui/index";

const features = [
  {
    icon: Hand,
    title: "Hands-Free Counting",
    description:
      "No need to tap a counter. Simply speak and Katheera counts automatically.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description:
      "The AI model runs entirely in your browser — no internet required after install.",
  },
  {
    icon: Lock,
    title: "Privacy-First",
    description:
      "Your voice never leaves your device. No servers, no storage, no tracking.",
  },
  {
    icon: Zap,
    title: "Lightweight",
    description:
      "Optimized to run quietly in the background without affecting browsing speed.",
  },
  {
    icon: LayoutGrid,
    title: "Simple Interface",
    description:
      "A clean minimal popup shows your zikr counts at a glance, anytime.",
  },
  {
    icon: Heart,
    title: "Built with Care",
    description:
      "Crafted by a Muslim developer for the Muslim community — with love.",
  },
];

const KeyFeatures = () => {
  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            Features
          </p>
          <h2 className="text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
            Everything you need,{" "}
            <span className="text-gradient">nothing you don't</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-muted/50 hover:bg-accent/40 group rounded-2xl p-6 transition-all duration-200"
            >
              <div className="bg-primary/5 group-hover:bg-primary/15 mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                <feature.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-foreground mb-1.5 text-base font-semibold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
