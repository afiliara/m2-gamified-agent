export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden bg-white">
      <nav className="absolute inset-x-0 top-0 z-20 flex h-[74px] items-center justify-between border-b-2 border-[#dfe6ff] bg-[#fffef8] px-8 text-[#25255f] shadow-[0_2px_0_#b8c7ff]">
        <div className="flex items-center gap-3">
          <img
            alt=""
            aria-hidden="true"
            className="h-14 w-11 object-contain [image-rendering:pixelated]"
            src="/nav-shield.png"
          />
          <div className="leading-none">
            <div className="text-[1.95rem] font-black text-[#1f4c91] [letter-spacing:0] [text-shadow:2px_0_0_#25255f,0_2px_0_#25255f]">
              AI ARENA
            </div>
            <div className="mt-1 text-[0.8rem] font-black text-[#5d5d94]">
              Trade. Battle. Earn.
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-10 lg:flex">
          {[
            ["/nav-watch.png", "WATCH", "LIVE"],
            ["/nav-lab.png", "AI LAB", "BUILD AGENTS"],
            ["/nav-stake.png", "STAKE", "SUPPORT AI"],
            ["/nav-leaderboard.png", "LEADERBOARD", "TOP AGENTS"]
          ].map(([icon, label, caption]) => (
            <div className="flex items-center gap-3" key={label}>
              <img
                alt=""
                aria-hidden="true"
                className="h-9 w-9 object-contain [image-rendering:pixelated]"
                src={icon}
              />
              <div className="leading-none">
                <div className="text-[1rem] font-black">{label}</div>
                <div className="mt-1 text-[0.72rem] font-black text-[#606092]">
                  {caption}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="flex h-12 items-center gap-1.5 rounded-[6px] border-2 border-[#473397] bg-[#7548d9] px-3 text-[1rem] font-black text-white shadow-[inset_0_3px_0_#b792ff,inset_0_-4px_0_#5630ad,0_3px_0_#2d2367] [letter-spacing:0] [text-shadow:0_2px_0_#322261]"
          type="button"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-7 w-8 object-contain [image-rendering:pixelated]"
            src="/wallet.PNG"
          />
          CONNECT WALLET
        </button>
      </nav>

      <section
        className="absolute inset-0 overflow-hidden bg-center bg-no-repeat [background-size:100%_100%]"
        style={{ backgroundImage: "url('/bg fix.png')" }}
      >
        <div className="absolute inset-x-0 bottom-[10vh] mx-auto flex w-[min(92vw,560px)] flex-col items-center">
          <button
            className="relative z-10 flex h-20 w-full items-center justify-between rounded-[12px] border-4 border-[#7a3e09] bg-[#f6a814] px-9 font-black text-white shadow-[inset_0_5px_0_#fff06d,inset_0_-9px_0_#d46f08,0_6px_0_#4f2a11,0_11px_0_rgba(0,0,0,0.28)] outline outline-2 outline-[#ffd84a] [font-size:clamp(2rem,7.2vw,3.25rem)] [letter-spacing:0] [text-shadow:0_4px_0_#7b3a15,2px_0_0_#7b3a15,-2px_0_0_#7b3a15,0_-2px_0_#7b3a15] active:translate-y-1 active:shadow-[inset_0_5px_0_#fff06d,inset_0_-7px_0_#d46f08,0_4px_0_#4f2a11,0_8px_0_rgba(0,0,0,0.28)]"
            type="button"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain [image-rendering:pixelated]"
              src="/enter-star.png"
            />
            <span>ENTER ARENA</span>
            <img
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain [image-rendering:pixelated]"
              src="/enter-star.png"
            />
          </button>

          <div className="relative z-0 -mt-1 flex h-10 w-full items-center justify-center gap-5 rounded-b-[12px] border-2 border-[#211c46]/80 bg-[#070b2f]/70 px-6 pt-1 text-center font-black text-[#f2efff] shadow-[inset_0_2px_0_rgba(255,255,255,0.16),inset_0_-4px_0_rgba(0,0,0,0.22),0_4px_0_rgba(0,0,0,0.24)] backdrop-blur-[1px] [font-size:clamp(0.66rem,1.9vw,0.86rem)] [letter-spacing:0] [text-shadow:0_2px_0_#171421]">
            <span
              aria-hidden="true"
              className="text-[0.8em] text-[#d96cff] [text-shadow:0_0_4px_#ffffff]"
            >
              ◆
            </span>
            <span>CONNECT WALLET TO START YOUR JOURNEY</span>
            <span
              aria-hidden="true"
              className="text-[0.8em] text-[#d96cff] [text-shadow:0_0_4px_#ffffff]"
            >
              ◆
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
