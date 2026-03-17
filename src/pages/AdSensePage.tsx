import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AdSensePage() {
  return (
    <div className="min-h-screen bg-hero py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="hero-card rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2" style={{ color: 'hsl(0 0% 100%)' }}>
            AdSense <span className="text-gradient">Disclaimer</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'hsl(220 15% 60%)' }}>Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>About Advertisements</h2>
              <p>Rankers Star may display advertisements served by Google AdSense. These ads help us cover the operational costs of running this free platform including server costs, domain charges, and development time.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>Google AdSense & Cookies</h2>
              <p>Google AdSense uses cookies to serve ads based on your prior visits to our website and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>Opting Out</h2>
              <p>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>. Alternatively, you can opt out of third-party vendor cookies at <a href="https://www.aboutads.info/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">aboutads.info</a>.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>Disclaimer</h2>
              <p>We do not endorse any products or services advertised on our platform. The advertisements are served automatically by Google and may not reflect the views of Rankers Star.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>Revenue Usage</h2>
              <p>All revenue generated from advertisements is used solely to maintain and improve Rankers Star — keeping it free and accessible for all students. This includes server hosting, domain renewal, and development of new features.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>Contact</h2>
              <p>For any concerns regarding advertisements, please contact us at <a href="mailto:studyspacerankers@gmail.com" className="text-primary hover:underline">studyspacerankers@gmail.com</a>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
