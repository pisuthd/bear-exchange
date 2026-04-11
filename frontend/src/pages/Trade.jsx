import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useWallet } from '../context/WalletContext';
import { checkHealth, getOrders, createOrder, cancelOrder, matchOrders } from '../services/api';
import { getCurrentPrices, formatPrice, priceToContract } from '../services/fx-prices';

const PAIRS = ['USD/EUR', 'USD/JPY', 'EUR/JPY'];

function Trade() {
  const { isConnected, isLoading: walletLoading, connectWallet } = useWallet();
  const [backendReady, setBackendReady] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  // Prices
  const [prices, setPrices] = useState({});
  const [selectedPair, setSelectedPair] = useState('USD/EUR');

  // Order form
  const [direction, setDirection] = useState('bid');
  const [priceInput, setPriceInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  // Match modal
  const [matchModal, setMatchModal] = useState(null);
  const [matching, setMatching] = useState(false);

  // Simulated price ticker
  useEffect(() => {
    const update = () => setPrices(getCurrentPrices());
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-fill price when pair changes
  useEffect(() => {
    if (prices[selectedPair]) {
      setPriceInput(prices[selectedPair].toFixed(selectedPair.includes('JPY') ? 2 : 4));
    }
  }, [selectedPair, prices]);

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
      if (res.success) {
        setOrders(res.data || []);
      }
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

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!priceInput || !amountInput) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const price = priceToContract(selectedPair, parseFloat(priceInput));
      const amount = (parseFloat(amountInput) * 1e6).toString();
      const result = await createOrder(selectedPair, direction, price, amount);
      if (result.success) {
        setSubmitResult({ type: 'success', message: `Order created! ID: ${result.data?.orderId?.slice(0, 12)}...` });
        setPriceInput('');
        setAmountInput('');
        await fetchOrders();
      } else {
        setSubmitResult({ type: 'error', message: result.error || 'Failed to create order' });
      }
    } catch (err) {
      setSubmitResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
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

  // Match orders
  const handleMatch = async () => {
    if (!matchModal) return;
    setMatching(true);
    try {
      const amount = (parseFloat(matchModal.matchAmount) * 1e6).toString();
      const result = await matchOrders(matchModal.bidOrderId, matchModal.askOrderId, amount);
      if (result.success) {
        setMatchModal(null);
        await fetchOrders();
      }
    } catch (err) {
      console.error('Match failed:', err);
    } finally {
      setMatching(false);
    }
  };

  // Filter orders by pair
  const pairOrders = orders.filter((o) => o.pair === selectedPair);
  const bidOrders = pairOrders.filter((o) => o.direction === 'bid' && o.status !== 'cancelled');
  const askOrders = pairOrders.filter((o) => o.direction === 'ask' && o.status !== 'cancelled');

  const statusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'matched': return 'text-blue-400';
      case 'cancelled': return 'text-[#64748b]';
      case 'failed': return 'text-red-400';
      default: return 'text-[#94a3b8]';
    }
  };

  const midPrice = prices[selectedPair];
  const isJPY = selectedPair.includes('JPY');
  const decimals = isJPY ? 2 : 4;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-4 md:px-8 py-12 md:py-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <p className="mb-3 text-sm md:text-base font-medium text-[#3eddfd] font-mono">
              Shielded Trading
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Trade
            </h1>
            <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl">
              Place shielded limit orders on cross-currency stablecoin pairs with full privacy on Midnight.
            </p>

            {/* Price Ticker */}
            <div className="mt-8 flex flex-wrap gap-4">
              {PAIRS.map((pair) => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                    selectedPair === pair
                      ? 'bg-[#3eddfd]/10 border-[#3eddfd]/50 text-[#3eddfd] shadow-[0_0_15px_rgba(62,223,223,0.15)]'
                      : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:border-[#3eddfd]/30'
                  }`}
                >
                  <span className="font-semibold">{pair}</span>
                  {prices[pair] && (
                    <span className="ml-2 font-mono">{formatPrice(pair, prices[pair])}</span>
                  )}
                </button>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] mb-4">Connect Your Wallet</h2>
                <p className="text-[#94a3b8] mb-8">Connect your Midnight Lace wallet to start trading shielded FX pairs.</p>
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

        {/* Backend checking */}
        {isConnected && backendChecking && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="w-12 h-12 border-2 border-[#3eddfd] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#94a3b8]">Checking backend status...</p>
            </div>
          </section>
        )}

        {/* Backend not ready */}
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

        {/* Main Trading UI */}
        {isConnected && backendReady && (
          <section className="relative px-4 md:px-8 py-8 md:py-12 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto w-full relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Order Form */}
                <div className="lg:col-span-4">
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8 sticky top-24">
                    <h2 className="text-xl font-bold text-[#f8fafc] mb-6">Place Order</h2>

                    {/* Direction Toggle */}
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => setDirection('bid')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          direction === 'bid'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155] hover:border-green-500/30'
                        }`}
                      >
                        Bid (Buy)
                      </button>
                      <button
                        onClick={() => setDirection('ask')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          direction === 'ask'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155] hover:border-red-500/30'
                        }`}
                      >
                        Ask (Sell)
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Pair (readonly) */}
                      <div>
                        <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5">Pair</label>
                        <div className="w-full py-3 px-4 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] font-mono text-sm">
                          {selectedPair}
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5">Price</label>
                        <input
                          type="text"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          placeholder={midPrice ? midPrice.toFixed(decimals) : '0.00'}
                          className="w-full py-3 px-4 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] font-mono text-sm focus:border-[#3eddfd]/50 focus:outline-none transition-colors"
                        />
                        {midPrice && (
                          <button
                            type="button"
                            onClick={() => setPriceInput(midPrice.toFixed(decimals))}
                            className="mt-1 text-xs text-[#3eddfd] hover:underline"
                          >
                            Use market price: {formatPrice(selectedPair, midPrice)}
                          </button>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5">Amount</label>
                        <input
                          type="text"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          placeholder="1000"
                          className="w-full py-3 px-4 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] font-mono text-sm focus:border-[#3eddfd]/50 focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !priceInput || !amountInput}
                        className={`w-full py-3.5 font-semibold rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          direction === 'bid'
                            ? 'bg-green-500 text-white hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'bg-red-500 text-white hover:bg-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        }`}
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          `Place ${direction.toUpperCase()} Order`
                        )}
                      </button>
                    </form>

                    {submitResult && (
                      <div className={`mt-3 text-xs ${submitResult.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {submitResult.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Book + My Orders */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Order Book */}
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-[#f8fafc]">
                        Order Book — <span className="text-[#3eddfd]">{selectedPair}</span>
                      </h2>
                      <button
                        onClick={fetchOrders}
                        disabled={ordersLoading}
                        className="px-3 py-1.5 text-xs font-medium text-[#3eddfd] bg-[#3eddfd]/10 border border-[#3eddfd]/20 rounded-lg hover:bg-[#3eddfd]/20 transition-all disabled:opacity-50"
                      >
                        {ordersLoading ? 'Loading...' : '↻ Refresh'}
                      </button>
                    </div>

                    {bidOrders.length === 0 && askOrders.length === 0 ? (
                      <div className="text-center py-12 text-[#64748b]">
                        <p className="text-lg mb-2">No orders for {selectedPair}</p>
                        <p className="text-sm">Be the first to place an order!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bids */}
                        <div>
                          <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full" />
                            Bids ({bidOrders.length})
                          </h3>
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 text-xs text-[#64748b] uppercase tracking-wider pb-2 border-b border-[#334155]">
                              <span>Price</span>
                              <span className="text-right">Amount</span>
                              <span className="text-right">Action</span>
                            </div>
                            {bidOrders.map((order) => (
                              <div key={order.orderId} className="grid grid-cols-3 text-sm py-2 border-b border-[#334155]/30">
                                <span className="text-green-400 font-mono">{(parseInt(order.price) / 1e6).toFixed(decimals)}</span>
                                <span className="text-right text-[#cbd5e1] font-mono">{(parseInt(order.amount) / 1e6).toLocaleString()}</span>
                                <span className="text-right">
                                  {order.status === 'active' && askOrders.length > 0 && (
                                    <button
                                      onClick={() => setMatchModal({
                                        bidOrderId: order.orderId,
                                        askOrderId: askOrders[0].orderId,
                                        matchAmount: Math.min(parseInt(order.amount), parseInt(askOrders[0].amount)) / 1e6,
                                      })}
                                      className="text-xs text-[#3eddfd] hover:underline mr-2"
                                    >
                                      Match
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCancel(order.orderId)}
                                    disabled={cancelling === order.orderId}
                                    className="text-xs text-red-400 hover:underline disabled:opacity-50"
                                  >
                                    {cancelling === order.orderId ? '...' : '✕'}
                                  </button>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Asks */}
                        <div>
                          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-400 rounded-full" />
                            Asks ({askOrders.length})
                          </h3>
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 text-xs text-[#64748b] uppercase tracking-wider pb-2 border-b border-[#334155]">
                              <span>Price</span>
                              <span className="text-right">Amount</span>
                              <span className="text-right">Action</span>
                            </div>
                            {askOrders.map((order) => (
                              <div key={order.orderId} className="grid grid-cols-3 text-sm py-2 border-b border-[#334155]/30">
                                <span className="text-red-400 font-mono">{(parseInt(order.price) / 1e6).toFixed(decimals)}</span>
                                <span className="text-right text-[#cbd5e1] font-mono">{(parseInt(order.amount) / 1e6).toLocaleString()}</span>
                                <span className="text-right">
                                  {order.status === 'active' && bidOrders.length > 0 && (
                                    <button
                                      onClick={() => setMatchModal({
                                        bidOrderId: bidOrders[0].orderId,
                                        askOrderId: order.orderId,
                                        matchAmount: Math.min(parseInt(bidOrders[0].amount), parseInt(order.amount)) / 1e6,
                                      })}
                                      className="text-xs text-[#3eddfd] hover:underline mr-2"
                                    >
                                      Match
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCancel(order.orderId)}
                                    disabled={cancelling === order.orderId}
                                    className="text-xs text-red-400 hover:underline disabled:opacity-50"
                                  >
                                    {cancelling === order.orderId ? '...' : '✕'}
                                  </button>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* All Orders Table */}
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[#f8fafc] mb-6">All Orders</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-[#64748b]">
                        <p>No orders yet. Place your first order above!</p>
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
                            {orders.slice().reverse().map((order) => (
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
                                  <span className={`text-xs font-medium capitalize ${statusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {order.status !== 'cancelled' && order.status !== 'matched' && (
                                    <button
                                      onClick={() => handleCancel(order.orderId)}
                                      disabled={cancelling === order.orderId}
                                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                    >
                                      {cancelling === order.orderId ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                  )}
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

        {/* Match Modal */}
        {matchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] border border-[#3eddfd]/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_40px_rgba(62,223,223,0.15)]">
              <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Match Orders</h3>
              <div className="space-y-3 text-sm text-[#94a3b8] mb-6">
                <p>Bid: <span className="text-green-400 font-mono">{matchModal.bidOrderId?.slice(0, 16)}...</span></p>
                <p>Ask: <span className="text-red-400 font-mono">{matchModal.askOrderId?.slice(0, 16)}...</span></p>
                <p>Amount: <span className="text-[#f8fafc] font-mono">{matchModal.matchAmount?.toLocaleString()}</span></p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleMatch}
                  disabled={matching}
                  className="flex-1 py-3 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-all disabled:opacity-50"
                >
                  {matching ? 'Matching...' : 'Confirm Match'}
                </button>
                <button
                  onClick={() => setMatchModal(null)}
                  disabled={matching}
                  className="flex-1 py-3 bg-[#334155] text-[#94a3b8] font-semibold rounded-lg hover:bg-[#475569] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Trade;