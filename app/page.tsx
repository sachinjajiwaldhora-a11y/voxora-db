import Link from 'next/link';
import { ParticipantTranscripts } from "./components/participant-transcripts";

const members = [
  { id: "kai", name: "Kai Nakamura", handle: "@kaizen", initials: "KN", color: "from-amber-400 to-orange-600", status: "Practicing now", online: true },
  { id: "mira", name: "Mira Sol", handle: "@mirage", initials: "MS", color: "from-fuchsia-400 to-violet-600", status: "Last seen 12m ago", online: false },
  { id: "jules", name: "Jules Park", handle: "@jules.exe", initials: "JP", color: "from-cyan-300 to-blue-600", status: "Online", online: true },
  { id: "ren", name: "Ren Ito", handle: "@ren.exe", initials: "RI", color: "from-lime-300 to-emerald-600", status: "Online", online: true },
];

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.7a4 4 0 0 1 0 7.4m2 3.8a4 4 0 0 1 3 3.9V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-white/[0.07] pb-5">
        <a href="#" className="group flex items-center gap-3" aria-label="Voxora home">
          <img 
            src="/Neon Waveform V Emblem.png" 
            alt="Voxora Logo" 
            className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
          />
          <span className="text-lg font-semibold tracking-[0.18em] text-white">VOXORA</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-zinc-500 md:flex" aria-label="Main navigation">
          <a href="#overview" className="text-zinc-200 transition hover:text-cyberYellow">Overview</a>
          <a href="#squad" className="transition hover:text-white">Your squad</a>
          <a href="#stats" className="transition hover:text-white">Stats</a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-cyberGreen/15 bg-cyberGreen/[0.06] px-3 py-1.5 text-xs text-cyberGreen sm:flex">
            <span className="size-1.5 rounded-full bg-cyberGreen shadow-neon-green" />
            SYSTEM ONLINE
          </span>
          <button type="button" aria-label="Open profile" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-zinc-200 transition hover:border-cyberYellow/40">
            AX
          </button>
        </div>
      </header>

      <section id="overview" className="relative grid flex-1 gap-10 py-12 md:py-16 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-16">
        <div className="pointer-events-none absolute -left-20 top-24 -z-10 size-72 rounded-full bg-cyberYellow/[0.04] blur-[100px]" />
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            <span className="size-1.5 rounded-full bg-cyberYellow shadow-neon-yellow" />
            Private friends group
          </div>
          <p className="mb-3 text-sm font-medium tracking-wide text-zinc-500">YOUR SPACE. YOUR PACE.</p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            Get in the zone.
            <br />
            <span className="text-cyberYellow">Level up</span> together.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
            Sharpen your skills with your people. No noise, just good practice and better progress.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link 
              href="/room/cyber-01"
              className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-cyberYellow px-5 text-sm font-semibold text-cyberBlack shadow-neon-yellow transition hover:-translate-y-0.5 hover:bg-yellow-300"
            >
              <PracticeIcon />
              Create Practice Room
              <ArrowUpRight />
            </Link>
            <Link 
              href="/room/cyber-01"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <UsersIcon />
              Join Practice Room
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member) => (
                <span key={member.initials} className={`grid size-7 place-items-center rounded-full border-2 border-cyberBlack bg-gradient-to-br ${member.color} text-[9px] font-bold text-white`}>
                  {member.initials}
                </span>
              ))}
            </div>
            <span><strong className="font-medium text-zinc-300">3 friends online</strong> · ready when you are</span>
          </div>
        </div>

        <aside id="squad" className="rounded-2xl border border-white/[0.08] bg-cyberDark/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Your circle</p>
              <h2 className="mt-1.5 text-lg font-semibold text-white">Night Shift</h2>
            </div>
            <button type="button" aria-label="View group options" className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <circle cx="4" cy="10" r="1.3" /><circle cx="10" cy="10" r="1.3" /><circle cx="16" cy="10" r="1.3" />
              </svg>
            </button>
          </div>
          <div className="mt-5 flex items-center justify-between border-y border-white/[0.06] py-3 text-xs">
            <span className="flex items-center gap-2 text-zinc-400">
              <span className="size-1.5 rounded-full bg-cyberGreen" />
              3 of 6 members online
            </span>
            <span className="rounded border border-white/[0.08] px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">Private</span>
          </div>
          <ParticipantTranscripts participants={members} />
          <button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] py-3 text-xs font-medium text-zinc-400 transition hover:border-cyberYellow/30 hover:text-cyberYellow">
            <PracticeIcon />
            Invite a friend
          </button>
        </aside>
      </section>

      <section id="stats" className="border-t border-white/[0.07] pt-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Your progress</p>
            <h2 className="mt-1 text-base font-medium text-zinc-200">The work adds up.</h2>
          </div>
          <span className="hidden text-xs text-zinc-600 sm:block">All time · just you</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-cyberYellow/20">
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-xl border border-cyberYellow/15 bg-cyberYellow/[0.07] text-cyberYellow">
                <ClockIcon />
              </span>
              <div>
                <p className="text-xs text-zinc-500">Total practice time</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">24<span className="ml-1 text-sm font-normal text-zinc-500">h</span> 38<span className="ml-1 text-sm font-normal text-zinc-500">m</span></p>
              </div>
            </div>
            <span className="rounded-md border border-cyberGreen/15 bg-cyberGreen/[0.06] px-2 py-1 text-[11px] font-medium text-cyberGreen">+18% <span className="text-cyberGreen/60">this week</span></span>
          </article>
          <article className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-cyberOrange/20">
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-xl border border-cyberOrange/15 bg-cyberOrange/[0.07] text-cyberOrange">
                <SparkIcon />
              </span>
              <div>
                <p className="text-xs text-zinc-500">Sentences processed</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">12,480</p>
              </div>
            </div>
            <span className="rounded-md border border-white/[0.07] px-2 py-1 text-[11px] text-zinc-500">All time</span>
          </article>
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between text-[11px] text-zinc-600">
        <span>© 2026 Voxora</span>
        <span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-cyberGreen" /> All systems operational</span>
      </footer>
    </main>
  );
}