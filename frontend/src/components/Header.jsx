import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import WalletInfoModal from './WalletInfoModal';

function Header() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isWalletInfoOpen, setIsWalletInfoOpen] = useState(false);
  const { isConnected, walletAddress, isLoading, connectWallet, disconnectWallet, truncateAddress } = useWallet();

  const navItems = [
    { label: 'Trade', path: '/trade' },
    { label: 'Market Make', path: '/market-make' },
    { label: 'Tokens', path: '/tokens' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-4 md:px-8 md:py-4">
        <nav className="max-w-7xl mx-auto flex">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              Innermost
            </Link>

            <div className="hidden ml-4 md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${location.pathname === item.path
                    ? 'text-[#3eddfd]'
                    : 'text-[#cbd5e1] hover:text-[#3eddfd]'
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="relative">
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="text-sm font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors flex items-center gap-1"
                >
                  More
                  <svg
                    className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                    <a
                      href="https://github.com/pisuthd/innermost"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-[#cbd5e1] hover:text-[#3eddfd] hover:bg-[#334155] transition-colors"
                    >
                      GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Network Status Indicator */}
            {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg border border-[#334155]">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
              <span className="text-sm text-[#cbd5e1] font-medium">Network: PreProd</span>
            </div> */}

            {isConnected ? (
              <>
                <button
                  onClick={() => setIsWalletInfoOpen(true)}
                  className="px-4 py-2 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg border border-[#3eddfd]/30 hover:bg-[#334155] hover:border-[#3eddfd]/50 transition-all text-sm"
                >
                  Wallet Info
                </button>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg border border-[#3eddfd]/30 hover:bg-[#334155] hover:border-[#3eddfd]/50 transition-all text-sm"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="px-4 py-2 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg border border-[#3eddfd]/30 hover:bg-[#334155] hover:border-[#3eddfd]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Connect Lace Wallet'}
              </button>
            )}
          </div>
        </nav>
      </header>

      <WalletInfoModal
        isOpen={isWalletInfoOpen}
        onClose={() => setIsWalletInfoOpen(false)}
      />
    </>
  );
}

export default Header;