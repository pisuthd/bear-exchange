import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function SwapFlowAnimation() {
  const [progress, setProgress] = useState(0); // 0-100, loop every 15 seconds

  const referencePrice = 152.50;

  // Order ladder data - created around reference price
  const orders = [
    { type: 'ask', price: 152.96, amount: 200 },
    { type: 'ask', price: 152.80, amount: 50 },
    { type: 'bid', price: 152.20, amount: 50 },
    { type: 'bid', price: 152.04, amount: 200 },
  ];

  // Animation loop (15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 0.5) % 100);
    }, 75);

    return () => clearInterval(interval);
  }, []);

  // Phase 1: Terminal Header (0-10% - 1.5s)
  const getHeaderOpacity = () => {
    if (progress < 10) return (progress / 10);
    return 1;
  };

  // Phase 2: AI Command (10-20% - 1.5s)
  const getCommandOpacity = () => {
    if (progress < 10) return 0;
    if (progress < 20) return (progress - 10) / 10;
    return 1;
  };

  // Phase 3: Orders Appearing (20-70% - 7.5s)
  const getOrderVisibility = (index) => {
    if (progress < 20) return 0;
    if (progress < 70) {
      const orderProgress = (progress - 20) * 4 / 50; // 0-4 across 50%
      return index < orderProgress ? 1 : 0;
    }
    return 1;
  };

  const getNewBadgeOpacity = (index) => {
    if (progress < 20) return 0;
    if (progress < 70) {
      const orderProgress = (progress - 20) * 4 / 50;
      const relativeProgress = orderProgress - index;
      if (relativeProgress >= 0 && relativeProgress < 0.1) {
        return 1; // Flash when first appears
      }
      if (relativeProgress >= 0.1) {
        return 0.5; // Dim after flash
      }
      return 0;
    }
    return 0.5;
  };

  // Phase 4: Status (70-80% - 1.5s)
  const getStatusOpacity = () => {
    if (progress < 70) return 0;
    if (progress < 80) return (progress - 70) / 10;
    return 1;
  };

  // Phase 5: Hold/Pause (80-100% - 3s) - No fade out, just hold visible
  const getResetOpacity = () => {
    return 0; // Always 0 - no fade out effect
  };

  const getRowType = (order) => {
    return order.type.toUpperCase();
  };

  return (
    <Link
      to="/market-make"
      className="relative w-full max-w-md h-[550px] flex items-center justify-center cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3eddfd] to-[#2dd4d4] opacity-10 blur-3xl rounded-full animate-pulse group-hover:opacity-20 transition-all duration-500" />

      {/* Terminal */}
      <div 
        className="relative bg-[#0a0f1a] border-2 border-gray-700 rounded-xl p-5 w-full max-w-sm font-mono text-sm"
        style={{ opacity: 1 - getResetOpacity() }}
      >
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="text-gray-400 text-xs flex-1 text-center">
            innermostfx-terminal
          </div>
        </div>

        {/* Market Data Line */}
        <div 
          className="text-gray-300 mb-3 flex items-center gap-2"
          style={{ opacity: getHeaderOpacity() }}
        >
          <span className="text-[#3eddfd]">USD/JPY:</span>
          <span className="text-gray-400">REF:</span>
          <span className="text-white font-bold">{referencePrice.toFixed(2)}</span>
        </div>

        {/* AI Command Line */}
        <div 
          className="text-gray-300 mb-4"
          style={{ opacity: getCommandOpacity() }}
        >
          <span className="text-[#3eddfd]">AI:</span>
          <span className="text-green-400"> Analyzing market → Building ladder...</span>
        </div>

        {/* Table Header */}
        <div 
          className="grid grid-cols-3 gap-2 text-gray-500 text-xs mb-2 pb-2 border-b border-gray-800"
          style={{ opacity: Math.min(getCommandOpacity(), 1) }}
        >
          <span>Type</span>
          <span className="text-right">Price</span>
          <span className="text-right">Amount</span>
        </div>

        {/* Orders Table */}
        <div className="space-y-1.5 mb-4">
          {/* ASKS */}
          {orders.filter(o => o.type === 'ask').map((order, idx) => (
            <div
              key={`ask-${idx}`}
              className={`grid grid-cols-3 gap-2 text-xs transition-all duration-300 ${
                order.type === 'ask' ? 'text-red-400' : 'text-green-400'
              }`}
              style={{
                opacity: getOrderVisibility(idx),
                transform: `translateX(${(1 - getOrderVisibility(idx)) * 20}px)`,
              }}
            >
              <span className="font-medium">{getRowType(order)}</span>
              <span className="text-right">{order.price.toFixed(2)}</span>
              <div className="flex items-center justify-end gap-2">
                <span>{order.amount}k</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 bg-[#3eddfd]/20 text-[#3eddfd] rounded"
                  style={{ opacity: getNewBadgeOpacity(idx) }}
                >
                  [NEW]
                </span>
              </div>
            </div>
          ))}

          {/* Reference Row */}
          <div 
            className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-gray-800"
            style={{ opacity: Math.min(getCommandOpacity(), 1) }}
          >
            <span className="text-gray-400 font-medium">MID</span>
            <span className="text-right text-white font-bold">{referencePrice.toFixed(2)}</span>
            <div className="flex justify-end items-center">
              <div className="w-2 h-2 rounded-full bg-[#3eddfd]" />
            </div>
          </div>

          {/* BIDS */}
          {orders.filter(o => o.type === 'bid').map((order, idx) => (
            <div
              key={`bid-${idx}`}
              className={`grid grid-cols-3 gap-2 text-xs transition-all duration-300 ${
                order.type === 'bid' ? 'text-green-400' : 'text-red-400'
              }`}
              style={{
                opacity: getOrderVisibility(idx + 2),
                transform: `translateX(${(1 - getOrderVisibility(idx + 2)) * 20}px)`,
              }}
            >
              <span className="font-medium">{getRowType(order)}</span>
              <span className="text-right">{order.price.toFixed(2)}</span>
              <div className="flex items-center justify-end gap-2">
                <span>{order.amount}k</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 bg-[#3eddfd]/20 text-[#3eddfd] rounded"
                  style={{ opacity: getNewBadgeOpacity(idx + 2) }}
                >
                  [NEW]
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Status Line */}
        <div 
          className="pt-3 border-t border-gray-800 text-gray-400 text-xs"
          style={{ opacity: getStatusOpacity() }}
        >
          <span className="text-green-400">✓</span>
          <span className="ml-1">
            {orders.length} orders created
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-[#0f172a] rounded-full h-1">
            <div
              className="h-full bg-gradient-to-r from-[#3eddfd] to-green-400 rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Click hint */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-4 text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Start Trading →
      </div>
    </Link>
  );
}

export default SwapFlowAnimation;