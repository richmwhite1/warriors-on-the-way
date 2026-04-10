import Link from "next/link";
import { AppNav } from "@/components/app-nav";

export const metadata = { title: "Install the App · Warriors on the Way" };

export default function InstallPage() {
  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-14">

        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">
            No app store required
          </p>
          <h1 className="text-4xl font-heading font-semibold">
            Install Warriors on the Way
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Add WoW to your home screen in 30 seconds — it works just like a native app,
            loads instantly, and keeps you connected to your community.
          </p>
        </div>

        {/* Platform sections */}
        <div className="space-y-10">

          {/* iOS */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-foreground flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-background" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold">iPhone &amp; iPad</h2>
                <p className="text-xs text-muted-foreground">Safari browser required</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: "Open in Safari",
                  desc: "Visit warriors-on-the-way.com in Safari. The install option only appears in Safari — not Chrome or Firefox.",
                  visual: <IosStep1Visual />,
                },
                {
                  step: 2,
                  title: 'Tap the Share icon',
                  desc: 'Tap the Share button at the bottom of the screen — it looks like a box with an arrow pointing up.',
                  visual: <IosStep2Visual />,
                },
                {
                  step: 3,
                  title: '"Add to Home Screen"',
                  desc: 'Scroll down in the Share sheet and tap "Add to Home Screen", then tap Add in the top right.',
                  visual: <IosStep3Visual />,
                },
              ].map(({ step, title, desc, visual }) => (
                <StepCard key={step} step={step} title={title} desc={desc}>
                  {visual}
                </StepCard>
              ))}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Android */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-[#3ddc84] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M17.523 15.341c-.3 0-.572-.107-.776-.311L12 10.283l-4.747 4.747c-.204.204-.476.311-.776.311-.3 0-.572-.107-.776-.311-.429-.429-.429-1.123 0-1.552l5.523-5.523c.204-.204.476-.311.776-.311.3 0 .572.107.776.311l5.523 5.523c.429.429.429 1.123 0 1.552-.204.204-.476.311-.776.311z"/>
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" fillOpacity=".2"/>
                  <path d="M3.513 9h16.974c.552 0 1 .449 1 1.001v3.998c0 .552-.448 1.001-1 1.001H3.513c-.552 0-1-.449-1-1.001V10.001C2.513 9.449 2.961 9 3.513 9z" fillOpacity="0"/>
                  <path d="M17.6 3.3L15.9 6c-.8-1.3-2.2-2-3.9-2s-3.1.7-3.9 2L6.4 3.3C7.9 1.9 9.8 1 12 1s4.1.9 5.6 2.3zM8 17H6v-1H5v-3h1v-1h2v1h1v3H8v1zm4 0h-2v-1H9v-3h1v-1h2v1h1v3h-1v1zm4 0h-2v-1h-1v-3h1v-1h2v1h1v3h-1v1z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold">Android</h2>
                <p className="text-xs text-muted-foreground">Chrome browser recommended</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: "Open in Chrome",
                  desc: "Visit the site in Chrome. You may see an automatic \"Add to Home Screen\" banner — tap it to install instantly.",
                  visual: <AndroidStep1Visual />,
                },
                {
                  step: 2,
                  title: "Tap the menu",
                  desc: 'If no banner appears, tap the three-dot menu ⋮ in the top-right corner of Chrome.',
                  visual: <AndroidStep2Visual />,
                },
                {
                  step: 3,
                  title: '"Add to Home Screen"',
                  desc: 'Tap "Add to Home Screen" in the menu, confirm the name, and tap Add.',
                  visual: <AndroidStep3Visual />,
                },
              ].map(({ step, title, desc, visual }) => (
                <StepCard key={step} step={step} title={title} desc={desc}>
                  {visual}
                </StepCard>
              ))}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Desktop */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold">Desktop</h2>
                <p className="text-xs text-muted-foreground">Chrome or Edge on Mac &amp; Windows</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: "Open in Chrome or Edge",
                  desc: "Visit the site in Chrome or Microsoft Edge on your Mac or Windows computer.",
                  visual: <DesktopStep1Visual />,
                },
                {
                  step: 2,
                  title: "Click the install icon",
                  desc: "Look for the install icon (⊕) in the address bar on the right side. Click it.",
                  visual: <DesktopStep2Visual />,
                },
                {
                  step: 3,
                  title: 'Click "Install"',
                  desc: 'A dialog will appear — click "Install" to add WoW to your taskbar and desktop.',
                  visual: <DesktopStep3Visual />,
                },
              ].map(({ step, title, desc, visual }) => (
                <StepCard key={step} step={step} title={title} desc={desc}>
                  {visual}
                </StepCard>
              ))}
            </div>
          </section>

        </div>

        {/* Why install */}
        <section className="rounded-2xl border bg-primary/5 border-primary/20 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg">Why install it?</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: "⚡", title: "Instant loading", body: "Opens in under a second — no waiting for the browser to load." },
              { icon: "🔔", title: "Stay connected", body: "Get notified about events, posts, and messages from your community." },
              { icon: "📲", title: "Full-screen experience", body: "No browser chrome — it looks and feels like a real app." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="space-y-1">
                <p className="text-xl">{icon}</p>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link href="/home" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>

      </main>
    </>
  );
}

function StepCard({ step, title, desc, children }: { step: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Visual area */}
      <div className="h-44 bg-muted/40 flex items-center justify-center">
        {children}
      </div>
      {/* Content */}
      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
            {step}
          </span>
          <p className="font-semibold text-sm">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Illustrated visuals (phone/browser mockups using SVG) ───────────────── */

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-24 h-40 rounded-[18px] border-2 border-foreground/20 bg-background shadow-md flex flex-col overflow-hidden">
      {/* Notch */}
      <div className="h-4 bg-muted/50 flex items-center justify-center shrink-0">
        <div className="w-8 h-1.5 rounded-full bg-foreground/20" />
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      {/* Home bar */}
      <div className="h-3 flex items-center justify-center shrink-0">
        <div className="w-10 h-1 rounded-full bg-foreground/20" />
      </div>
    </div>
  );
}

function BrowserMockup({ children, highlight }: { children: React.ReactNode; highlight?: string }) {
  return (
    <div className="w-48 rounded-xl border border-foreground/20 bg-background shadow-md overflow-hidden text-[9px]">
      {/* Browser chrome */}
      <div className="bg-muted/50 px-2 py-1.5 flex items-center gap-1.5 border-b border-foreground/10">
        <div className="flex gap-1">
          <div className="size-1.5 rounded-full bg-red-400" />
          <div className="size-1.5 rounded-full bg-yellow-400" />
          <div className="size-1.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-background/80 rounded px-1.5 py-0.5 text-muted-foreground truncate">
          warriors-on-the-way.com
        </div>
        {highlight && (
          <div className="shrink-0 text-primary font-bold">{highlight}</div>
        )}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function MiniAppScreen() {
  return (
    <div className="p-1 space-y-1">
      <div className="h-2 bg-primary/20 rounded w-3/4" />
      <div className="h-1.5 bg-muted rounded w-full" />
      <div className="h-1.5 bg-muted rounded w-5/6" />
      <div className="h-1.5 bg-muted rounded w-4/5" />
    </div>
  );
}

function IosStep1Visual() {
  return (
    <PhoneMockup>
      <BrowserMockup>
        <MiniAppScreen />
      </BrowserMockup>
    </PhoneMockup>
  );
}

function IosStep2Visual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <PhoneMockup>
        <div className="h-full relative">
          <MiniAppScreen />
          <div className="absolute bottom-0 left-0 right-0 bg-muted/80 border-t border-foreground/10 flex items-center justify-center py-1">
            <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        </div>
      </PhoneMockup>
      <p className="text-[10px] text-primary font-semibold">Tap share ↑</p>
    </div>
  );
}

function IosStep3Visual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 rounded-xl border border-foreground/20 bg-background shadow text-[8px] overflow-hidden">
        <div className="bg-muted/50 px-2 py-1 text-center font-semibold text-[9px] border-b border-foreground/10">Share</div>
        {["Copy Link", "Add Bookmark", "Add to Home Screen", "Print"].map((item) => (
          <div
            key={item}
            className={`px-2 py-1.5 border-b border-foreground/5 flex items-center gap-1.5 ${item === "Add to Home Screen" ? "bg-primary/10 font-semibold text-primary" : "text-foreground/70"}`}
          >
            {item === "Add to Home Screen" && <span className="text-[10px]">＋</span>}
            {item}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-primary font-semibold">Tap this →</p>
    </div>
  );
}

function AndroidStep1Visual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <PhoneMockup>
        <div className="h-full">
          <div className="bg-muted/50 px-1 py-0.5 text-[7px] text-center text-muted-foreground">warriors-on-the-way.com</div>
          <MiniAppScreen />
          <div className="mx-1 mt-1 bg-primary/10 border border-primary/30 rounded px-1 py-0.5 text-[7px] text-primary font-medium text-center">
            Add to Home Screen
          </div>
        </div>
      </PhoneMockup>
      <p className="text-[10px] text-muted-foreground">Banner may appear automatically</p>
    </div>
  );
}

function AndroidStep2Visual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <PhoneMockup>
        <div className="relative h-full">
          <div className="bg-muted/50 px-1 py-0.5 flex items-center gap-1">
            <div className="flex-1 bg-background/80 rounded h-2" />
            <span className="text-[8px] font-bold text-foreground/60">⋮</span>
          </div>
          <div className="absolute right-0 top-4 w-20 bg-background border border-foreground/20 shadow-lg rounded text-[7px]">
            {["New tab", "Add to Home Screen", "Settings"].map((item) => (
              <div key={item} className={`px-2 py-1 border-b border-foreground/5 ${item === "Add to Home Screen" ? "text-primary font-bold" : "text-foreground/60"}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </PhoneMockup>
      <p className="text-[10px] text-primary font-semibold">Tap ⋮ menu</p>
    </div>
  );
}

function AndroidStep3Visual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 rounded-xl border border-foreground/20 bg-background shadow text-[8px] overflow-hidden">
        <div className="p-2 space-y-1.5">
          <p className="font-bold text-[9px]">Add to Home Screen?</p>
          <div className="flex items-center gap-1.5">
            <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">W</div>
            <span className="text-foreground/80">Warriors on the Way</span>
          </div>
          <div className="flex gap-1 justify-end pt-1">
            <div className="px-2 py-1 rounded text-muted-foreground border border-foreground/10">Cancel</div>
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">Add</div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-primary font-semibold">Tap Add</p>
    </div>
  );
}

function DesktopStep1Visual() {
  return (
    <BrowserMockup>
      <MiniAppScreen />
    </BrowserMockup>
  );
}

function DesktopStep2Visual() {
  return (
    <BrowserMockup highlight="⊕">
      <MiniAppScreen />
    </BrowserMockup>
  );
}

function DesktopStep3Visual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-40 rounded-xl border border-foreground/20 bg-background shadow text-[8px] overflow-hidden">
        <div className="p-3 space-y-2">
          <p className="font-bold text-[9px]">Install Warriors on the Way?</p>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">W</div>
            <div>
              <p className="font-semibold text-foreground/80">Warriors on the Way</p>
              <p className="text-muted-foreground">warriors-on-the-way.com</p>
            </div>
          </div>
          <div className="flex gap-1 justify-end">
            <div className="px-2 py-1 rounded text-muted-foreground border border-foreground/10">Cancel</div>
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">Install</div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-primary font-semibold">Click Install</p>
    </div>
  );
}
