import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import { WalletProvider } from './context/WalletContext'

export default function App() {
  return (
    <WalletProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </WalletProvider>
  )
}