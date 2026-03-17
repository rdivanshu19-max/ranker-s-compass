import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="hero-card rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2" style={{ color: 'hsl(0 0% 100%)' }}>
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'hsl(220 15% 60%)' }}>Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>1. Information We Collect</h2>
              <p>We collect your display name, email address, and usage data (such as study time, test scores, and downloaded materials) to provide a personalized experience.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>2. How We Use Your Information</h2>
              <p>Your data is used solely to power dashboard features, track study progress, and improve the platform. We do not sell or share your personal data with third parties.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>3. Cookies and Tracking</h2>
              <p>We use cookies and local storage to maintain your session and theme preferences. Third-party services like Google AdSense may use cookies for ad personalization.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>4. Data Security</h2>
              <p>We employ industry-standard security measures to protect your data. However, no method of electronic transmission is 100% secure.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>5. Third-Party Services</h2>
              <p>We may use Google AdSense for advertising. Google may use cookies to serve ads based on your visit to our site and other sites. You can opt out at <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(0 0% 100%)' }}>6. Your Rights</h2>
              <p>You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:studyspacerankers@gmail.com" className="text-primary hover:underline">studyspacerankers@gmail.com</a>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
