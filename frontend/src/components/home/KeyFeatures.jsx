import { useState } from 'react';

function KeyFeatures() {
  const [activeTab, setActiveTab] = useState(0);
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Full Privacy by Default on Midnight",
      description: "Shielded limit orders with zero-knowledge proofs. Prices, amounts, directions, and fill states never appear on-chain — only opaque commitment hashes. Trade with complete confidentiality while retaining verifiable audit trails."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "AI-Powered Market Making",
      description: "Market makers leverage AI agents to intelligently generate and manage order ladders with competitive spreads. Automatically post multiple tiered limit orders in a single transaction around real-time FX rates for optimal liquidity provision."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332-.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Non-AMM Shielded Orderbook",
      description: "True limit-order matching without liquidity pools or slippage curves. Traders get precise execution at quoted rates. Market makers control spreads and depth — perfect for cross-currency stablecoin pairs like USD/JPY, USD/EUR, and EUR/JPY."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Institutional-Grade Compliance",
      description: "Built-in auditability through public trade counters and commitment hashes. Prove regulatory compliance and trade validity on demand via selective disclosure — without ever exposing sensitive order details."
    }
  ];

  return (
    <section className="relative py-20 md:py-32 px-4 md:px-8 bg-[#0f172a]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">
            Key Features
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto" />
        </div>

        {/* Sidebar Tabs Layout */}
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar - Navigation Tabs */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-8 space-y-2">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 border ${activeTab === index
                    ? 'bg-gradient-to-r from-[#3eddfd]/20 to-[#3eddfd]/5 border-[#3eddfd]/50 shadow-[0_0_20px_rgba(62,223,223,0.2)]'
                    : 'bg-[#1e293b] border-[#334155] hover:border-[#3eddfd]/30 hover:bg-[#1e293b]/80'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-colors duration-300 ${activeTab === index ? 'text-[#3eddfd]' : 'text-[#94a3b8]'
                      }`}>
                      {feature.icon}
                    </div>
                    <span className={`font-semibold transition-colors duration-300 ${activeTab === index ? 'text-[#f8fafc]' : 'text-[#94a3b8]'
                      }`}>
                      {feature.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#3eddfd]/10 rounded-2xl p-4 sm:p-8 md:p-12 min-h-[400px] transition-all duration-500 hover:border-[#3eddfd]/20">
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Active Feature Icon */}
                <div className="w-20 h-20 bg-[#3eddfd]/10 rounded-2xl flex items-center justify-center mb-8">
                  <div className="text-[#3eddfd]">
                    {features[activeTab].icon}
                  </div>
                </div>

                {/* Active Feature Title */}
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[#f8fafc]">
                  {features[activeTab].title}
                </h3>

                {/* Active Feature Description */}
                <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed max-w-3xl">
                  {features[activeTab].description}
                </p>

                {/* Decorative Elements */}
                <div className="mt-8 pt-8 border-t border-[#334155]/50">
                  <div className="flex items-center gap-2 text-[#3eddfd] text-sm font-medium">
                    <div className="w-2 h-2 bg-[#3eddfd] rounded-full animate-pulse" />
                    <span>Feature {activeTab + 1} of {features.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default KeyFeatures;