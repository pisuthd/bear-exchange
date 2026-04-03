import { Link } from 'react-router-dom';

function CTA() {
    return (
        <section className="py-24 px-4 md:px-8 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
            <div className="max-w-3xl mx-auto text-center">

                {/* Headline */}
                <h2 className="text-3xl md:text-4xl lg:text-4xl font-bold mb-6 text-[#f8fafc] tracking-tight">
                    Ready to Get Started?
                </h2>

                {/* Subtle decorative line */}
                <div className="w-16 h-1 bg-[#3eddfd] mx-auto mb-8" />


                {/* CTA Button */}
                <Link to="/dashboard">
                    <button className="px-8 py-4 bg-[#3eddfd] hover:bg-[#2dd4d4] text-[#0f172a] font-bold text-lg rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(62,223,223,0.3)] hover:shadow-[0_0_30px_rgba(62,223,223,0.5)]">
                        Go to Dashboard
                    </button>
                </Link>
            </div>
        </section>
    );
}

export default CTA;