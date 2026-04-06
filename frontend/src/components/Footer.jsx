import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-[#1e293b] border-t border-[#334155]">
      <div className="max-w-7xl mx-auto py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Column 1: Logo & Description */}
          <div className="text-center col-span-3 md:text-left">
            <Link
              to="/"
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent mb-4 inline-block hover:opacity-80 transition-opacity"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              BearEx
            </Link>
            <p className="text-[#94a3b8] text-sm leading-relaxed">
              Private AMM with Shielded Liquidity on Midnight
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-[#f8fafc] font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/swap"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Swap
                </Link>
              </li>
              <li>
                <Link
                  to="/liquidity"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Liquidity
                </Link>
              </li>
              <li>
                <Link
                  to="/tokens"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Tokens
                </Link>
              </li>
               <li>
                <Link
                  to="https://github.com/pisuthd/bear-exchange"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#334155] mb-6"></div>

        {/* Bottom Row: Social Links, Hackathon Badge & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          {/* GitHub Link */}
          <div className="flex items-center gap-4"> 
            <p className="text-[#94a3b8] text-sm">
              Made with ❤️ during INTO The MIDNIGHT Hackathon
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[#94a3b8] text-sm mb-1">
              © 2026 Bear Exchange
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;