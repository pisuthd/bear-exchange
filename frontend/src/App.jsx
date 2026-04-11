import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Tokens from './pages/Tokens'
import Trade from './pages/Trade'
import MarketMake from './pages/MarketMake'
import { WalletProvider } from './context/WalletContext'

export default function App() {
  return (
    <WalletProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/market-make" element={<MarketMake />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </WalletProvider>
  )
}
