import Link from "next/link";
import { AppNav } from "@/components/app-nav";

export const metadata = { title: "Install the App · Warriors on the Way" };

export default function InstallPage() {
  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">
            No app store required
          </p>
          <h1 className="text-3xl font-heading font-semibold">
            Add to your Home Screen
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Warriors on the Way works like a native app — fast, full-screen, with push notifications.
            Follow the steps for your device below.
          </p>
        </div>

        {/* iOS — most prominent */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-foreground flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 fill-background" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold">iPhone &amp; iPad</h2>
              <p className="text-xs text-muted-foreground">Safari browser · takes about 30 seconds</p>
            </div>
          </div>

          {/* Official Apple link */}
          <a
            href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm hover:bg-muted/70 transition-colors"
          >
            <svg className="size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <span>View official Apple instructions →</span>
          </a>

          {/* Steps */}
          <div className="space-y-4">
            <IosStep
              number={1}
              title="Open in Safari"
              desc='Visit warriors-on-the-way.vercel.app in Safari. This only works in Safari — not Chrome or Firefox.'
            >
              <SafariBrowserVisual />
            </IosStep>

            <IosStep
              number={2}
              title="Tap the Share button"
              desc='Tap the Share button at the bottom of Safari — the box with an arrow pointing up.'
            >
              <ShareButtonVisual />
            </IosStep>

            <IosStep
              number={3}
              title='Tap "Add to Home Screen"'
              desc='Scroll down in the Share sheet and tap "Add to Home Screen".'
            >
              <ShareSheetVisual />
            </IosStep>

            <IosStep
              number={4}
              title='Tap "Add"'
              desc='Confirm the name (Warriors on the Way) and tap Add in the top-right corner.'
            >
              <AddConfirmVisual />
            </IosStep>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* Android */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#3ddc84] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M17.523 15.341c-.3 0-.572-.107-.776-.311L12 10.283l-4.747 4.747c-.204.204-.476.311-.776.311-.3 0-.572-.107-.776-.311-.429-.429-.429-1.123 0-1.552l5.523-5.523c.204-.204.476-.311.776-.311.3 0 .572.107.776.311l5.523 5.523c.429.429.429 1.123 0 1.552-.204.204-.476.311-.776.311z"/>
                <path d="M3.513 9h16.974c.552 0 1 .449 1 1.001v3.998c0 .552-.448 1.001-1 1.001H3.513c-.552 0-1-.449-1-1.001V10.001C2.513 9.449 2.961 9 3.513 9z" fillOpacity="0"/>
                <path d="M17.6 3.3L15.9 6c-.8-1.3-2.2-2-3.9-2s-3.1.7-3.9 2L6.4 3.3C7.9 1.9 9.8 1 12 1s4.1.9 5.6 2.3zM8 17H6v-1H5v-3h1v-1h2v1h1v3H8v1zm4 0h-2v-1H9v-3h1v-1h2v1h1v3h-1v1zm4 0h-2v-1h-1v-3h1v-1h2v1h1v3h-1v1z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold">Android</h2>
              <p className="text-xs text-muted-foreground">Chrome browser recommended</p>
            </div>
          </div>

          <div className="space-y-4">
            <IosStep
              number={1}
              title="Open in Chrome"
              desc="Visit the site in Chrome. You may see an 'Add to Home Screen' banner — tap it."
            >
              <AndroidBannerVisual />
            </IosStep>

            <IosStep
              number={2}
              title="Tap the ⋮ menu"
              desc='If no banner appears, tap the three-dot menu in the top-right corner of Chrome.'
            >
              <AndroidMenuVisual />
            </IosStep>

            <IosStep
              number={3}
              title='"Add to Home Screen"'
              desc='Tap "Add to Home Screen" and confirm by tapping Add.'
            >
              <AndroidAddVisual />
            </IosStep>
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
              <p className="text-xs text-muted-foreground">Chrome or Edge · Mac &amp; Windows</p>
            </div>
          </div>

          <div className="space-y-4">
            <IosStep
              number={1}
              title="Look for the install icon"
              desc="In Chrome or Edge, look for the ⊕ install icon in the address bar (right side)."
            >
              <DesktopInstallVisual />
            </IosStep>
            <IosStep
              number={2}
              title='Click "Install"'
              desc='Click the icon, then click Install in the dialog that appears.'
            >
              <DesktopConfirmVisual />
            </IosStep>
          </div>
        </section>

        {/* Why install */}
        <section className="rounded-2xl border bg-primary/5 border-primary/20 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg">Why install it?</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: "⚡", title: "Instant loading", body: "Opens in under a second — no waiting for the browser to load." },
              { icon: "🔔", title: "Push notifications", body: "Get notified about events, posts, and messages from your community." },
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

        <div className="text-center pb-8">
          <Link href="/home" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>

      </main>
    </>
  );
}

/* ── Step wrapper ─────────────────────────────────────────────────────────── */

function IosStep({
  number, title, desc, children,
}: {
  number: number; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-4">
      {/* Step number */}
      <div className="shrink-0 size-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
        </div>
        {/* Visual */}
        <div className="flex justify-center py-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── iPhone shell ─────────────────────────────────────────────────────────── */

function IPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-44 rounded-[28px] border-[3px] border-foreground/25 bg-white shadow-xl overflow-hidden" style={{ aspectRatio: "9/19" }}>
      {/* Dynamic island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
      <div className="h-full overflow-hidden bg-[#f2f2f7]">
        {children}
      </div>
    </div>
  );
}

/* ── iOS illustrations ────────────────────────────────────────────────────── */

function SafariBrowserVisual() {
  return (
    <IPhone>
      {/* Safari UI */}
      <div className="h-full flex flex-col">
        <div className="h-7" /> {/* status bar */}
        {/* Safari URL bar */}
        <div className="bg-white border-b border-gray-200 px-3 py-2">
          <div className="bg-gray-100 rounded-lg px-3 py-1 flex items-center gap-1">
            <svg className="size-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd"/></svg>
            <span className="text-[9px] text-gray-500 flex-1 text-center">warriors-on-the-way.vercel.app</span>
          </div>
        </div>
        {/* Page content */}
        <div className="flex-1 bg-white p-3 space-y-2">
          <div className="h-3 bg-gray-800 rounded w-3/4" />
          <div className="h-2 bg-gray-300 rounded w-full" />
          <div className="h-2 bg-gray-300 rounded w-5/6" />
          <div className="h-2 bg-gray-300 rounded w-4/5" />
          <div className="mt-3 h-14 bg-[#8B4513]/20 rounded-xl" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
        </div>
        {/* Safari bottom bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="size-5 text-gray-400">←</div>
          <div className="size-5 text-gray-400">→</div>
          <svg className="size-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M12 3v13.5M8.25 9.75 12 6l3.75 3.75" />
          </svg>
          <div className="size-5 text-gray-400 border border-gray-300 rounded-sm text-[8px] flex items-center justify-center">⊡</div>
          <div className="size-5 text-gray-400">⋯</div>
        </div>
      </div>
    </IPhone>
  );
}

function ShareButtonVisual() {
  return (
    <IPhone>
      <div className="h-full flex flex-col">
        <div className="h-7" />
        <div className="bg-white border-b border-gray-200 px-3 py-2">
          <div className="bg-gray-100 rounded-lg px-3 py-1 text-[9px] text-gray-500 text-center">warriors-on-the-way.vercel.app</div>
        </div>
        <div className="flex-1 bg-white p-3 space-y-2">
          <div className="h-3 bg-gray-800 rounded w-3/4" />
          <div className="h-2 bg-gray-300 rounded w-full" />
          <div className="h-2 bg-gray-300 rounded w-5/6" />
        </div>
        {/* Safari bottom bar — Share button highlighted */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="size-5 text-gray-400">←</div>
          <div className="size-5 text-gray-400">→</div>
          <div className="relative">
            <svg className="size-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M12 3v13.5M8.25 9.75 12 6l3.75 3.75" />
            </svg>
            {/* Tap indicator */}
            <div className="absolute -top-1 -right-1 size-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="size-5 text-gray-400 border border-gray-300 rounded-sm text-[8px] flex items-center justify-center">⊡</div>
          <div className="size-5 text-gray-400">⋯</div>
        </div>
      </div>
    </IPhone>
  );
}

function ShareSheetVisual() {
  return (
    <IPhone>
      <div className="h-full flex flex-col">
        <div className="h-7" />
        {/* Dimmed page behind sheet */}
        <div className="flex-1 bg-black/20 p-3 space-y-2">
          <div className="h-3 bg-white/60 rounded w-3/4" />
          <div className="h-2 bg-white/40 rounded w-full" />
        </div>
        {/* Share sheet */}
        <div className="bg-[#f2f2f7] rounded-t-2xl border-t border-gray-300">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-200">
            <span className="text-[9px] text-[#007AFF]">Cancel</span>
            <span className="text-[10px] font-semibold">Share</span>
            <span className="text-[9px] text-[#007AFF]">Copy</span>
          </div>
          {/* App icons row */}
          <div className="flex gap-3 px-4 py-2 overflow-hidden">
            {["🟦","🟩","🟨","🟥"].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="size-8 rounded-xl bg-white shadow flex items-center justify-center text-base">{c}</div>
                <span className="text-[7px] text-gray-500">App</span>
              </div>
            ))}
          </div>
          {/* Action rows */}
          <div className="mx-3 rounded-xl bg-white overflow-hidden">
            {[
              { label: "Copy Link", icon: "🔗", highlight: false },
              { label: "Add to Home Screen", icon: "＋", highlight: true },
              { label: "Add Bookmark", icon: "📌", highlight: false },
              { label: "Print", icon: "🖨️", highlight: false },
            ].map(({ label, icon, highlight }) => (
              <div
                key={label}
                className={[
                  "flex items-center gap-3 px-3 py-2 border-b border-gray-100 last:border-0",
                  highlight ? "bg-[#007AFF]/10" : "",
                ].join(" ")}
              >
                <span className="text-sm">{icon}</span>
                <span className={`text-[10px] ${highlight ? "text-[#007AFF] font-semibold" : "text-gray-700"}`}>
                  {label}
                </span>
                {highlight && <span className="ml-auto text-[9px] text-[#007AFF]">← tap this</span>}
              </div>
            ))}
          </div>
          <div className="h-4" />
        </div>
      </div>
    </IPhone>
  );
}

function AddConfirmVisual() {
  return (
    <IPhone>
      <div className="h-full flex flex-col bg-[#f2f2f7]">
        <div className="h-7" />
        {/* Navigation bar */}
        <div className="bg-[#f2f2f7] px-4 py-2 flex items-center justify-between border-b border-gray-200">
          <span className="text-[10px] text-[#007AFF]">Cancel</span>
          <span className="text-[10px] font-semibold">Add to Home Screen</span>
          <span className="text-[10px] text-[#007AFF] font-semibold">Add</span>
        </div>
        {/* App preview */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="size-16 rounded-2xl bg-[#8B4513] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            W
          </div>
          <div className="bg-white rounded-xl px-4 py-2 w-full">
            <input
              readOnly
              value="Warriors on the Way"
              className="w-full text-center text-[11px] bg-transparent text-gray-800 outline-none"
            />
          </div>
          <p className="text-[9px] text-gray-500 text-center">
            An icon will be added to your Home Screen so you can quickly access this website.
          </p>
        </div>
        {/* Tap Add highlight */}
        <div className="px-4 pb-6">
          <div className="bg-[#007AFF] text-white text-[11px] font-semibold rounded-xl py-3 text-center">
            Tap "Add" in the top right ↑
          </div>
        </div>
      </div>
    </IPhone>
  );
}

/* ── Android illustrations ────────────────────────────────────────────────── */

function AndroidBannerVisual() {
  return (
    <div className="w-52 rounded-2xl border-2 border-foreground/20 bg-white shadow-xl overflow-hidden">
      <div className="bg-[#202124] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-[#303134] rounded-full px-3 py-1 text-[9px] text-gray-400">warriors-on-the-way.vercel.app</div>
        <span className="text-gray-400 text-sm">⋮</span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="h-2 bg-gray-800 rounded w-3/4" />
        <div className="h-1.5 bg-gray-300 rounded w-full" />
        <div className="h-1.5 bg-gray-300 rounded w-5/6" />
      </div>
      {/* Install banner */}
      <div className="mx-2 mb-2 bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-[#8B4513] flex items-center justify-center text-white text-sm font-bold">W</div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-800 truncate">Warriors on the Way</p>
          <p className="text-[8px] text-gray-500">Add to Home screen</p>
        </div>
        <button className="bg-blue-600 text-white text-[9px] px-2 py-1 rounded-full font-semibold">Add</button>
      </div>
    </div>
  );
}

function AndroidMenuVisual() {
  return (
    <div className="w-52 rounded-2xl border-2 border-foreground/20 bg-white shadow-xl overflow-hidden">
      <div className="bg-[#202124] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-[#303134] rounded-full px-3 py-1 text-[9px] text-gray-400">warriors-on-the-way.vercel.app</div>
        <div className="relative">
          <span className="text-white text-base font-bold">⋮</span>
          <div className="absolute -top-1 -right-1 size-3 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      {/* Dropdown menu */}
      <div className="relative">
        <div className="p-3 space-y-1.5">
          <div className="h-2 bg-gray-300 rounded w-full" />
        </div>
        <div className="absolute top-0 right-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10">
          {["New tab", "New incognito tab", "Add to Home screen", "Share…", "Settings"].map((item) => (
            <div
              key={item}
              className={`px-3 py-2 text-[9px] border-b border-gray-100 last:border-0 ${item === "Add to Home screen" ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"}`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AndroidAddVisual() {
  return (
    <div className="w-52 rounded-xl border border-foreground/20 bg-white shadow-xl overflow-hidden">
      <div className="p-4 space-y-3">
        <p className="text-[10px] font-bold text-gray-800">Add to Home screen</p>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#8B4513] flex items-center justify-center text-white font-bold">W</div>
          <div>
            <p className="text-[9px] font-medium text-gray-800">Warriors on the Way</p>
            <p className="text-[8px] text-gray-500">warriors-on-the-way.vercel.app</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="px-3 py-1.5 rounded text-[9px] text-gray-600">Cancel</div>
          <div className="px-3 py-1.5 rounded bg-blue-600 text-white text-[9px] font-semibold">Add</div>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop illustrations ────────────────────────────────────────────────── */

function DesktopInstallVisual() {
  return (
    <div className="w-64 rounded-xl border-2 border-foreground/20 bg-white shadow-xl overflow-hidden">
      {/* Chrome browser chrome */}
      <div className="bg-[#dee1e6] px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400" />
          <div className="size-2.5 rounded-full bg-yellow-400" />
          <div className="size-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-full px-3 py-1 flex items-center gap-1.5">
          <svg className="size-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
          <span className="text-[9px] text-gray-600 flex-1">warriors-on-the-way.vercel.app</span>
          {/* Install icon highlighted */}
          <div className="relative">
            <svg className="size-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" /></svg>
            <div className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-2.5 bg-gray-800 rounded w-2/3" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-2 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function DesktopConfirmVisual() {
  return (
    <div className="w-60 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="px-4 py-3 space-y-3">
        <p className="text-[11px] font-bold text-gray-800">Install Warriors on the Way?</p>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#8B4513] flex items-center justify-center text-white font-bold text-lg">W</div>
          <div>
            <p className="text-[10px] font-semibold text-gray-800">Warriors on the Way</p>
            <p className="text-[9px] text-gray-500">warriors-on-the-way.vercel.app</p>
          </div>
        </div>
        <p className="text-[9px] text-gray-500">This site can be installed as an app for easy access from your taskbar.</p>
        <div className="flex justify-end gap-2">
          <div className="px-3 py-1.5 rounded text-[9px] text-gray-600 border border-gray-200">Cancel</div>
          <div className="px-3 py-1.5 rounded bg-blue-600 text-white text-[9px] font-semibold">Install</div>
        </div>
      </div>
    </div>
  );
}
