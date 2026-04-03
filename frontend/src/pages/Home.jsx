import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/home/Hero';
import KeyFeatures from '../components/home/KeyFeatures'; 
import CTA from '../components/home/CTA';

function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="pt-20">
        <Hero />
        <KeyFeatures /> 
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
