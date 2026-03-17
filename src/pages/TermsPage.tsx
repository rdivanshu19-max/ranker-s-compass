import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-hero py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="hero-card rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2" style={{ color: 'hsl(0 0% 100%)' }}>
            Terms & <span className="text-gradient">Conditions</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'hsl(220 15% 60%)' }}>Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>1. Acceptance of Terms</h2>
              <p>By accessing and using Rankers Star, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>2. Description of Service</h2>
              <p>Rankers Star is a free educational platform providing study materials, AI-powered tools, and mock tests for JEE, NEET, and Board exam preparation. We aggregate and curate publicly available study resources for educational purposes.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>3. User Accounts</h2>
              <p>Users must provide accurate information during registration. You are responsible for maintaining the confidentiality of your account credentials. We reserve the right to suspend accounts that violate these terms.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>4. Intellectual Property</h2>
              <p>Study materials shared on Rankers Star are curated from publicly available sources for educational purposes under fair use. If you are the copyright owner and wish to have your content removed, please contact us at studyspacerankers@gmail.com.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>5. User Conduct</h2>
              <p>Users shall not misuse the platform, upload malicious content, attempt unauthorized access, or use the platform for any commercial purposes without permission.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>6. Limitation of Liability</h2>
              <p>Rankers Star is provided "as is" without warranties. We are not liable for any damages arising from the use of our platform or study materials.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>7. Contact</h2>
              <p>For questions regarding these terms, email us at <a href="mailto:studyspacerankers@gmail.com" className="text-primary hover:underline">studyspacerankers@gmail.com</a>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
