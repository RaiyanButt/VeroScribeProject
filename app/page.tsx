import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden"
      style={{ 
        /* Custom Modern Care Aurora */
        backgroundColor: "#f8fafc",
        backgroundImage: 
          "radial-gradient(at 80% 0%, #e0f2fe 0px, transparent 50%), " +
          "radial-gradient(at 0% 50%, #fce7f3 0px, transparent 50%), " +
          "radial-gradient(at 50% 100%, #e0e7ff 0px, transparent 50%)"
      }}>

      {/* Logo / wordmark */}
      <div className="animate-fade-up mb-12 text-center relative z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
           <img 
             src="/v-logo.svg" 
             alt="Veroscribe Icon" 
             className="h-16 w-auto drop-shadow-sm"
           />
        </div>

        <h1 className="font-sans font-medium text-5xl md:text-6xl mb-6 leading-tight text-slate-900 tracking-tight">
          Intelligent scheduling for <br />
          <span className="font-serif italic font-normal text-slate-800">modern care.</span>
        </h1>
        <p className="font-sans text-lg max-w-xl mx-auto text-slate-600">
          A seamless booking experience for patients, and an effortless clinic OS for providers.
        </p>
      </div>

      {/* Portal cards */}
      <div className="animate-fade-up animate-fade-up-delay-1 flex flex-col sm:flex-row gap-4 w-full max-w-xl justify-center relative z-10">

        {/* Patient portal button */}
        <Link href="/patient" className="flex-1 text-center rounded-lg py-4 px-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 font-sans font-medium text-slate-900 border border-slate-300"
          style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)" }}>
          Book as Patient
        </Link>

        {/* Admin portal button */}
        <Link href="/admin" className="flex-1 text-center rounded-lg py-4 px-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 font-sans font-medium text-white shadow-md"
          style={{ background: "var(--color-button-dark, #0f172a)" }}>
          Provider Login
        </Link>

      </div>
    </main>
  );
}