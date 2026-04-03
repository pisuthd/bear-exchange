import { useWallet } from '../context/WalletContext';

function WalletInfoModal({ isOpen, onClose }) {
  const { walletInfo } = useWallet();

  const formatBalance = (value, decimals = 6) => {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'bigint') {
      const divisor = BigInt(Math.pow(10, decimals));
      const balance = Number(value) / Number(divisor);
      return balance.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    }
    if (typeof value === 'number') {
      const divisor = Math.pow(10, decimals);
      return (value / divisor).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Handle balance objects
      if (value.balance !== undefined) {
        return formatBalance(value.balance, 15); // Dust balance uses 15 decimals
      }
      // Handle nested objects by serializing with BigInt handling
      const replacer = (key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        return val;
      };
      return JSON.stringify(value, replacer);
    }
    return '0';
  };

  const formatAddress = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Extract address from object if possible
      if (value.unshieldedAddress) return formatAddress(value.unshieldedAddress);
      if (value.shieldedAddress) return formatAddress(value.shieldedAddress);
      if (value.dustAddress) return formatAddress(value.dustAddress);
      // Otherwise serialize object with BigInt handling
      const replacer = (key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        return val;
      };
      return JSON.stringify(value, replacer);
    }
    return 'N/A';
  };

  const truncateAddress = (address) => {
    if (!address || typeof address !== 'string') return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#334155]">
          <h2 className="text-xl font-bold text-[#3eddfd]">Wallet Information</h2>
          <button
            onClick={onClose}
            className="text-[#cbd5e1] hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {walletInfo ? (
            <div className="space-y-6">
              {/* Shielded Addresses */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#3eddfd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Shielded Address
                </h3>
                <div className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
                  <p className="text-sm text-[#cbd5e1] break-all font-mono">
                    {formatAddress(walletInfo.shieldedAddresses?.shieldedAddress)}
                  </p>
                </div>
              </div>

              {/* Unshielded Address */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#3eddfd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Unshielded Address
                </h3>
                <div className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
                  <p className="text-sm text-[#cbd5e1] break-all font-mono">
                    {formatAddress(walletInfo.unshieldedAddress)}
                  </p>
                </div>
              </div>

              {/* Unshielded Balances */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#3eddfd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Unshielded Balances
                </h3>
                <div className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
                  {walletInfo.unshieldedBalances && Object.keys(walletInfo.unshieldedBalances).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(walletInfo.unshieldedBalances).map(([token, balance]) => (
                        <div key={token} className="flex justify-between items-center text-sm">
                          <span className="text-[#cbd5e1] font-mono">{truncateAddress(token) === "00000000...0000" ? "NIGHT" : truncateAddress(token)}</span>
                          <span className="text-[#3eddfd] font-semibold font-mono">
                            {formatBalance(balance, 6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748b]">No unshielded balances</p>
                  )}
                </div>
              </div>

              {/* Dust Address */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#3eddfd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  Dust Address
                </h3>
                <div className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
                  <p className="text-sm text-[#cbd5e1] break-all font-mono">
                    {formatAddress(walletInfo.dustAddress)}
                  </p>
                </div>
              </div>

              {/* Dust Balance */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#3eddfd]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Dust Balance
                </h3>
                <div className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]">

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#cbd5e1] font-mono">
                        DUST
                      </span>
                      <span className="text-[#3eddfd] font-semibold font-mono">
                        {formatBalance(walletInfo.dustBalance, 15)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#64748b]">No wallet information available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#334155] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg border border-[#3eddfd]/30 hover:bg-[#334155] hover:border-[#3eddfd]/50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default WalletInfoModal;