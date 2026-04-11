import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useWallet } from '../context/WalletContext';
import { checkHealth, getOrders, createOrder, cancelOrder } from '../services/api';
import { getCurrentPrices, formatPrice } from '../services/fx-prices';
import { generateLadder, chatResponse } from '../services/mock-ai';

const PAIRS = ['USD/EUR', 'USD/JPY', 'EUR/JPY'];
const RISK_LEVELS = ['conservative', 'moderate', 'aggressive'];

function MarketMake() {
  const { isConnected, isLoading: walletLoading, connectWallet } = useWallet();
  const [backendReady, setBackendReady] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  // Config
  const [selectedPair, setSelectedPair] = useState('USD/EUR');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [levels, setLevels] = useState(5);
  const [totalAmount, setTotalAmount] = useState(10000);

  // Prices
  const [prices, setPrices] = useState({});

  // AI state
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployResults, setDeployResults] = useState([]);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "👋 I'm your AI market making assistant. Configure your parameters and hit **Generate Ladder** to get started, or ask me anything about market making strategy!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Price ticker
  useEffect(() => {
    const update = () => setPrices(getCurrentPrices());
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check backend
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const health = await checkHealth();
        if (!cancelled) {
          setBackendReady(health.walletReady === true);
          setBackendChecking(false);
        }
      } catch {
        if (!cancelled) {
          setBackendReady(false);
          setBackendChecking(false);
        }
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!backendReady) return;
    setOrdersLoading(true);
    try {
      const res = await getOrders();
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [backendReady]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Generate AI ladder
  const handleGenerate = async () => {
    if (!prices[selectedPair]) return;
    setGenerating(true);
    setDeployResults([]);
    try {
      const result = await generateLadder({
        pair: selectedPair,
        midPrice: prices[selectedPair],
        levels,
        totalAmount,
        riskLevel,
      });
      setAiResult(result);
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Deploy all orders
  const handleDeployAll = async () => {
    if (!aiResult?.orders?.length) return;
    setDeploying(true);
    setDeployResults([]);
    const results = [];

    for (const order of aiResult.orders) {
      try {
        const res = await createOrder(order.pair, order.direction, order.contractPrice, order.contractAmount);
        results.push({ ...order, success: res.success, orderId: res.data?.orderId, error: res.error });
      } catch (err) {
        results.push({ ...order, success: false, error: err.message });
      }
    }

    setDeployResults(results);
    setDeploying(false);
    await fetchOrders();
  };

  // Cancel order
  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      await fetchOrders();
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setCancelling(null);
    }
  };

  // Chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const reply = await chatResponse(userMsg);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble processing that. Try again!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const midPrice = prices[selectedPair];
  const isJPY = selectedPair.includes('JPY');
  const decimals = isJPY ? 2 : 4;
  const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'matched');
  const riskEmoji = { conservative: '🛡️', moderate: '⚖️', aggressive: '🔥' };
  const riskColor = { conservative: 'text-blue-400', moderate: 'text-yellow-400', aggressive: 'text-red-400' };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative px-4 md:px-8 py-12 md:py-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <p className="mb-3 text-sm md:text-base font-medium text-[#3eddfd] font-mono">
              AI-Powered Market Making
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Market Make
            </h1>
            <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl">
              Generate optimal order ladders with AI analysis. Deploy balanced bid/ask strategies across multiple price levels.
            </p>

            {/* Price Ticker */}
            <div className="mt-8 flex flex-wrap gap-4">
              {PAIRS.map((pair) => (
                <div key={pair} className="px-4 py-2.5 rounded-xl border bg-[#1e293b] border-[#334155] text-sm font-medium">
                  <span className="text-[#94a3b8]">{pair}</span>
                  {prices[pair] && (
                    <span className="ml-2 font-mono text-[#3eddfd]">{formatPrice(pair, prices[pair])}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Connect Wallet Gate */}
        {!isConnected && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-12 md:p-16 max-w-xl mx-auto">
                <div className="w-20 h-20 bg-[#3eddfd]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] mb-4">Connect Your Wallet</h2>
                <p className="text-[#94a3b8] mb-8">Connect your Midnight Lace wallet to start AI-powered market making.</p>
                <button
                  onClick={connectWallet}
                  disabled={walletLoading}
                  className="px-8 py-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {walletLoading ? 'Connecting...' : 'Connect Lace Wallet'}
                </button>
              </div>
            </div>
          </section>
        )}

        {isConnected && backendChecking && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="w-12 h-12 border-2 border-[#3eddfd] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#94a3b8]">Checking backend status...</p>
            </div>
          </section>
        )}

        {isConnected && !backendChecking && !backendReady && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-12 max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-red-300 mb-2">Backend Not Available</h3>
                <p className="text-[#94a3b8] text-sm">Make sure the backend API is running on port 3000.</p>
              </div>
            </div>
          </section>
        )}

        {/* Main UI */}
        {isConnected && backendReady && (
          <section className="relative px-4 md:px-8 py-8 md:py-12 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto w-full relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Config + AI Chat */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Configuration */}
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[#f8fafc] mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuration
                    </h2>

                    {/* Pair selector */}
                    <div className="mb-5">
                      <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-2">Trading Pair</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAIRS.map((pair) => (
                          <button
                            key={pair}
                            onClick={() => setSelectedPair(pair)}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                              selectedPair === pair
                                ? 'bg-[#3eddfd]/10 border border-[#3eddfd]/50 text-[#3eddfd]'
                                : 'bg-[#0f172a] border border-[#334155] text-[#94a3b8] hover:border-[#3eddfd]/30'
                            }`}
                          >
                            {pair}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="mb-5">
                      <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-2">Risk Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {RISK_LEVELS.map((risk) => (
                          <button
                            key={risk}
                            onClick={() => setRiskLevel(risk)}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                              riskLevel === risk
                                ? 'bg-[#3eddfd]/10 border border-[#3eddfd]/50 text-[#3eddfd]'
                                : 'bg-[#0f172a] border border-[#334155] text-[#94a3b8] hover:border-[#3eddfd]/30'
                            }`}
                          >
                            {riskEmoji[risk]} {risk.charAt(0).toUpperCase() + risk.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Levels */}
                    <div className="mb-5">
                      <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-2">
                        Levels per side: <span className="text-[#3eddfd]">{levels}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={levels}
                        onChange={(e) => setLevels(parseInt(e.target.value))}
                        className="w-full accent-[#3eddfd]"
                      />
                      <div className="flex justify-between text-xs text-[#64748b] mt-1">
                        <span>1</span><span>5</span><span>10</span>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="mb-6">
                      <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-2">Total Amount Per Side</label>
                      <input
                        type="text"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                        className="w-full py-3 px-4 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] font-mono text-sm focus:border-[#3eddfd]/50 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerate}
                      disabled={generating || !midPrice}
                      className="w-full py-3.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                          AI Generating...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Generate AI Ladder
                        </>
                      )}
                    </button>

                    {midPrice && (
                      <p className="mt-3 text-xs text-center text-[#64748b]">
                        Mid price: <span className="text-[#3eddfd] font-mono">{formatPrice(selectedPair, midPrice)}</span>
                      </p>
                    )}
                  </div>

                  {/* AI Chat */}
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-[#f8fafc] mb-4 flex items-center gap-2">
                      <span className="text-lg">🤖</span> AI Assistant
                    </h2>
                    <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-[#3eddfd]/10 text-[#cbd5e1] border border-[#3eddfd]/20'
                              : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                          }`}>
                            {msg.content.split('**').map((part, j) =>
                              j % 2 === 1 ? <strong key={j} className="text-[#f8fafc]">{part}</strong> : part
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="text-sm text-[#64748b] flex items-center gap-2">
                          <div className="w-3 h-3 border border-[#3eddfd] border-t-transparent rounded-full animate-spin" />
                          Thinking...
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about strategy..."
                        className="flex-1 py-2.5 px-4 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] text-sm focus:border-[#3eddfd]/50 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2.5 bg-[#3eddfd]/10 border border-[#3eddfd]/30 text-[#3eddfd] rounded-lg hover:bg-[#3eddfd]/20 transition-all disabled:opacity-50 text-sm"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: AI Result + Orders */}
                <div className="lg:col-span-7 space-y-6">

                  {/* AI Generated Ladder */}
                  {aiResult && (
                    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#3eddfd]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(62,223,223,0.08)]">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
                          <span>✨</span> AI Generated Ladder
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${riskColor[riskLevel]}`}>
                            Confidence: {aiResult.confidence}%
                          </span>
                          <span className="text-xs text-[#64748b]">
                            Spread: {aiResult.spreadPct}%
                          </span>
                        </div>
                      </div>

                      {/* Ladder Table */}
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-[#64748b] uppercase tracking-wider border-b border-[#334155]">
                              <th className="text-left py-2 px-2">Label</th>
                              <th className="text-left py-2 px-2">Side</th>
                              <th className="text-right py-2 px-2">Price</th>
                              <th className="text-right py-2 px-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiResult.orders.map((order, i) => (
                              <tr key={i} className="border-b border-[#334155]/30">
                                <td className="py-2 px-2 text-[#94a3b8] text-xs">{order.label}</td>
                                <td className="py-2 px-2">
                                  <span className={`text-xs font-semibold ${order.direction === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
                                    {order.direction.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-[#f8fafc]">{order.price.toFixed(decimals)}</td>
                                <td className="py-2 px-2 text-right font-mono text-[#cbd5e1]">{order.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-4 mb-6">
                        <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">AI Analysis</p>
                        <div className="text-sm text-[#94a3b8] whitespace-pre-line leading-relaxed">
                          {aiResult.reasoning.split('**').map((part, j) =>
                            j % 2 === 1 ? <strong key={j} className="text-[#f8fafc]">{part}</strong> : part
                          )}
                        </div>
                      </div>

                      {/* Deploy Results */}
                      {deployResults.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Deploy Results</p>
                          <div className="space-y-1">
                            {deployResults.map((r, i) => (
                              <div key={i} className={`text-xs ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                                {r.success ? '✓' : '✕'} {r.label}: {r.direction} @ {r.price.toFixed(decimals)} — {r.success ? 'Created' : r.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deploy Button */}
                      <button
                        onClick={handleDeployAll}
                        disabled={deploying}
                        className="w-full py-3.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      >
                        {deploying ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                            Deploying {aiResult.orders.length} orders...
                          </>
                        ) : (
                          <>🚀 Deploy All {aiResult.orders.length} Orders</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Active Orders */}
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-[#f8fafc]">
                        Active Orders
                        <span className="ml-2 text-sm font-normal text-[#64748b]">({activeOrders.length})</span>
                      </h2>
                      <button
                        onClick={fetchOrders}
                        disabled={ordersLoading}
                        className="px-3 py-1.5 text-xs font-medium text-[#3eddfd] bg-[#3eddfd]/10 border border-[#3eddfd]/20 rounded-lg hover:bg-[#3eddfd]/20 transition-all disabled:opacity-50"
                      >
                        {ordersLoading ? 'Loading...' : '↻ Refresh'}
                      </button>
                    </div>

                    {activeOrders.length === 0 ? (
                      <div className="text-center py-8 text-[#64748b]">
                        <p className="text-lg mb-2">No active orders</p>
                        <p className="text-sm">Generate an AI ladder above to get started!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-[#64748b] uppercase tracking-wider border-b border-[#334155]">
                              <th className="text-left py-3 px-2">Pair</th>
                              <th className="text-left py-3 px-2">Side</th>
                              <th className="text-right py-3 px-2">Price</th>
                              <th className="text-right py-3 px-2">Amount</th>
                              <th className="text-center py-3 px-2">Status</th>
                              <th className="text-right py-3 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeOrders.map((order) => (
                              <tr key={order.orderId} className="border-b border-[#334155]/30 hover:bg-[#334155]/10">
                                <td className="py-3 px-2 text-[#cbd5e1] font-mono text-xs">{order.pair}</td>
                                <td className="py-3 px-2">
                                  <span className={`text-xs font-semibold ${order.direction === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
                                    {order.direction.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-[#f8fafc]">
                                  {(parseInt(order.price) / 1e6).toFixed(decimals)}
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-[#cbd5e1]">
                                  {(parseInt(order.amount) / 1e6).toLocaleString()}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="text-xs font-medium capitalize text-yellow-400">{order.status}</span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <button
                                    onClick={() => handleCancel(order.orderId)}
                                    disabled={cancelling === order.orderId}
                                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                  >
                                    {cancelling === order.orderId ? '...' : 'Cancel'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default MarketMake;