import { Link } from 'react-router-dom';
import SwapFlowAnimation from './SwapFlowAnimation';

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
              Shielded cross-currency stablecoin swaps on Midnight
            </p>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-[56px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Privacy-First FX Matching with AI Market Making
            </h1>

            {/* Subheadline */}
            <h2 className=" text-sm md:text-base  lg:text-[24px] mb-8   text-[#cbd5e1]  ">
              AI-powered market makers deliver optimal rates and deep liquidity — slippage-free, front-running-proof atomic execution
            </h2>
            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-12">
              <Link
                to="/trade"
                className="px-8 py-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] hover:-translate-y-0.5 text-center"
              >
                Start Private Swap
              </Link>
              <Link
                to="/market-make"
                className="px-8 py-4 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30 text-center"
              >
                Become a Market Maker 
              </Link>
            </div>

            {/* Live Network Badge */}
            <div className="flex items-center gap-3 text-xs md:text-sm text-[#3eddfd]">
              <img
                src="https://s2.coinmarketcap.com/static/img/coins/64x64/39064.png"
                alt="Midnight"
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">Live now on Midnight's Preprod network</span>
            </div>
          </div>

          {/* Right Side - Swap Flow Animation */}
          <div className="relative flex items-center justify-center">
            <SwapFlowAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;