import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative flex items-center  px-4 md:px-8 py-20 md:py-32 overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Pre-Headline */}
            <p className="mb-4 text-sm md:text-base lg:text-xl font-medium text-[#3eddfd] font-mono">
              Private AMM with Shielded Liquidity on Midnight
            </p>

            {/* Main Headline */}
            <h1 className=" text-4xl lg:text-[56px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Hidden Liquidity. Proven Execution.
            </h1>

            {/* Subheadline */}
            <h2 className=" text-base  lg:text-[24px] mb-8   text-[#cbd5e1]  ">
              Trade and provide liquidity in fully shielded pools. Oracle-referenced pricing with ZK proofs — privacy by default, compliance when needed.
            </h2>
            {/* CTA Buttons */}
            <div className="flex  flex-row gap-4 mb-12">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] hover:-translate-y-0.5 text-center"
              >
                Swap Now
              </Link>
              <Link
                to="/credentials"
                className="px-8 py-4 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30 text-center"
              >
                Add Liquidity
              </Link>
            </div>
          </div>

          {/* Right Side - Brand Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3eddfd] to-[#2dd4d4] opacity-20 blur-3xl rounded-full" />

              {/* Brand Image */}
              <img
                src="/made-in-bear-brand.png"
                alt="MadeInBear Brand"
                className="relative w-full max-w-md h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;