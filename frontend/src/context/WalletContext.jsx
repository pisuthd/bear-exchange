import { createContext, useContext, useState } from 'react';
import '@midnight-ntwrk/dapp-connector-api';

const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);

  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("window.midnight -->", window.midnight);

      // Check if wallet is available
      if (!window.midnight) {
        throw new Error('Midnight Lace wallet not found. Please install the wallet extension.');
      }

      // Find the Lace wallet dynamically (wallet ID changes)
      const walletIds = Object.keys(window.midnight);
      const laceWalletId = walletIds.find(id => {
        const wallet = window.midnight[id];
        return wallet.name === 'lace' || wallet.rdns === 'io.lace.wallet';
      });

      if (!laceWalletId) {
        throw new Error('Midnight Lace wallet not found. Please install the wallet extension.');
      }

      console.log('Found Lace wallet ID:', laceWalletId);

      // Access the Midnight Lace wallet through the window object
      const wallet = window.midnight[laceWalletId];

      // Connect to the specified network (use 'preprod' for PreProd network)
      const connectedApi = await wallet.connect('preprod');

      // Retrieve all wallet information
      const addressesAndBalances = {
        shieldedBalances: await connectedApi.getShieldedBalances(),
        unshieldedBalances: await connectedApi.getUnshieldedBalances(),
        dustBalance: await connectedApi.getDustBalance(),
        shieldedAddresses: await connectedApi.getShieldedAddresses(),
        unshieldedAddress: await connectedApi.getUnshieldedAddress(),
        dustAddress: await connectedApi.getDustAddress(),
      };

      // Check if the connection is established
      const connectionStatus = await connectedApi.getConnectionStatus();
      const address = addressesAndBalances.shieldedAddresses.shieldedAddress;

      if (connectionStatus && address) {
        setIsConnected(true);
        setWalletAddress(address);
        setWalletInfo(addressesAndBalances);
        console.log("Connected to the wallet:", address);
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setError(null);
    setWalletInfo(null);
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        isLoading,
        error,
        walletInfo,
        connectWallet,
        disconnectWallet,
        truncateAddress
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};