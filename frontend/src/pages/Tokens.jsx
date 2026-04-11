import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useWallet } from '../context/WalletContext';
import { checkHealth, getBalances, getWalletInfo, mintToken } from '../services/api';

const TOKEN_CONFIG = {
  USD: { symbol: 'USDC', name: 'Shielded USDC', icon: '$', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  EUR: { symbol: 'EURC', name: 'Shielded EURC', icon: '€', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' },
  JPY: { symbol: 'JPYC', name: 'Shielded JPYC', icon: '¥', color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' },
};

const FAUCET_AMOUNT = '1000000000'; // 1,000 tokens (with 6 decimals)

function formatTokenAmount(rawStr, decimals = 6) {
  if (!rawStr || rawStr === '0') return '0.00';
  const raw = BigInt(rawStr);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

function Tokens() {
  const { isConnected, isLoading: walletLoading, connectWallet } = useWallet();
  const [backendReady, setBackendReady] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);
  const [balances, setBalances] = useState({ USD: '0', EUR: '0', JPY: '0' });
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState({ USD: false, EUR: false, JPY: false });
  const [mintResults, setMintResults] = useState({ USD: null, EUR: null, JPY: null });
  const [error, setError] = useState(null);

  // Check backend health on mount
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

  // Fetch balances and wallet info when backend is ready
  const fetchData = useCallback(async () => {
    if (!backendReady) return;
    setLoading(true);
    setError(null);
    try {
      const [balRes, infoRes] = await Promise.all([getBalances(), getWalletInfo()]);
      if (balRes.success) {
        setBalances(balRes.data.shielded);
      }
      if (infoRes.success) {
        setWalletData(infoRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [backendReady]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMint = async (token) => {
    setMinting((prev) => ({ ...prev, [token]: true }));
    setMintResults((prev) => ({ ...prev, [token]: null }));
    try {
      const result = await mintToken(token, FAUCET_AMOUNT);
      if (result.success) {
        setMintResults((prev) => ({ ...prev, [token]: 'success' }));
        await fetchData(); // Refresh balances
      }
    } catch (err) {
      setMintResults((prev) => ({ ...prev, [token]: err.message || 'Mint failed' }));
    } finally {
      setMinting((prev) => ({ ...prev, [token]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="pt-20">
        {/* Hero / Title Section */}
        <section className="relative px-4 md:px-8 py-16 md:py-24 bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <p className="mb-3 text-sm md:text-base font-medium text-[#3eddfd] font-mono">
              Token Management
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Balance Overview
            </h1>
            <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl">
              View your shielded token balances and mint testnet tokens via the faucet.
            </p>
          </div>
        </section>

        {/* Bug Notice Banner */}
        {/* <section className="px-4 md:px-8 bg-[#0f172a]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-amber-300/80">
                <span className="font-semibold text-amber-300">Note:</span> Due to a known Midnight SDK bug (midnight-js#781), browser-based ZK proof generation fails. Token operations use a shared backend wallet for this hackathon demo.
              </p>
            </div>
          </div>
        </section> */}

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
                <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-[#94a3b8] mb-8">
                  Connect your Midnight Lace wallet to view balances and mint testnet tokens.
                </p>
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

        {/* Backend Status Check */}
        {isConnected && backendChecking && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="w-12 h-12 border-2 border-[#3eddfd] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#94a3b8]">Checking backend status...</p>
            </div>
          </section>
        )}

        {/* Backend Not Ready */}
        {isConnected && !backendChecking && !backendReady && (
          <section className="px-4 md:px-8 py-20 bg-[#0f172a]">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-12 max-w-xl mx-auto">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-red-300 mb-2">Backend Not Available</h3>
                <p className="text-[#94a3b8] text-sm">
                  Make sure the backend API is running on port 3000.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Connected & Backend Ready — Show Balances & Mint */}
        {isConnected && backendReady && (
          <section className="relative px-4 md:px-8 py-12 md:py-16 bg-[#0f172a]">
            {/* Gradient Orbs */}
            <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#3eddfd]/3 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto w-full relative z-10 space-y-12">
              {/* Shared Wallet Info */}
              {/* {walletData && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#3eddfd]/5 border border-[#3eddfd]/20">
                  <div className="w-2 h-2 bg-[#3eddfd] rounded-full animate-pulse" />
                  <p className="text-sm text-[#3eddfd]">
                    <span className="font-semibold">Shared Wallet Active</span>
                    <span className="text-[#94a3b8] ml-2">
                      Shielded: <span className="font-mono text-[#cbd5e1]">{walletData.shieldedAddress?.slice(0, 10)}...{walletData.shieldedAddress?.slice(-6)}</span>
                    </span>
                  </p>
                </div>
              )} */}

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Balance Overview */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc]">Shielded Balances</h2>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="px-4 py-2 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg border border-[#3eddfd]/30 hover:bg-[#334155] hover:border-[#3eddfd]/50 transition-all text-sm disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : '↻ Refresh'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(TOKEN_CONFIG).map(([token, config]) => (
                    <div
                      key={token}
                      className="group bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-[#3eddfd]/30 hover:shadow-[0_0_20px_rgba(62,223,223,0.1)]"
                    >
                      {/* Token Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                          style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#f8fafc]">{config.symbol}</h3>
                          <p className="text-sm text-[#94a3b8]">{config.name}</p>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="mb-6">
                        <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Balance</p>
                        <p className="text-3xl md:text-4xl font-bold text-[#f8fafc] font-mono">
                          {loading ? (
                            <span className="text-[#334155]">—</span>
                          ) : (
                            formatTokenAmount(balances[token])
                          )}
                        </p>
                      </div>

                      {/* Token Label */}
                      <div className="pt-4 border-t border-[#334155]/50">
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                          <span>Innermost:{token}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mint / Faucet Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] mb-2">Testnet Faucet</h2>
                  <p className="text-[#94a3b8] text-sm">Mint test tokens to your shared shielded wallet. Each mint gives 1,000 tokens.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(TOKEN_CONFIG).map(([token, config]) => (
                    <div
                      key={token}
                      className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-[#3eddfd]/20"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#f8fafc]">Mint {config.symbol}</h3>
                          <p className="text-xs text-[#64748b] font-mono">Amount: 1,000 {config.symbol}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMint(token)}
                        disabled={minting[token]}
                        className="w-full py-3 px-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {minting[token] ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                            Minting...
                          </span>
                        ) : (
                          `Mint ${config.symbol}`
                        )}
                      </button>

                      {/* Mint Result Feedback */}
                      {mintResults[token] === 'success' && (
                        <div className="mt-3 flex items-center gap-2 text-green-400 text-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Minted successfully!
                        </div>
                      )}
                      {mintResults[token] && mintResults[token] !== 'success' && (
                        <div className="mt-3 text-red-400 text-xs">
                          {mintResults[token]}
                        </div>
                      )}
                    </div>
                  ))}
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

export default Tokens;