import { motion } from 'framer-motion';
import { Zap, BookOpen, Users, Download, Star, ArrowRight, Send, Sparkles, Target, Brain, GraduationCap, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const stats = [
  { icon: BookOpen, value: '500+', label: 'Free Materials', color: 'text-primary' },
  { icon: Users, value: '10K+', label: 'Active Students', color: 'text-primary' },
  { icon: Download, value: '50K+', label: 'Downloads', color: 'text-primary' },
  { icon: Star, value: '4.8★', label: 'Avg Rating', color: 'text-primary' },
];

const features = [
  { icon: BookOpen, title: 'Rankers Library', desc: 'Access 500+ curated lectures, books, PYQs, and notes for JEE, NEET & Boards.' },
  { icon: Brain, title: 'AI-Powered Doubts', desc: 'Get instant answers to your study doubts with RankerPulse AI chatbot.' },
  { icon: Target, title: 'AI Mock Tests', desc: 'Practice CBT-mode tests matching actual JEE/NEET patterns with detailed analysis.' },
  { icon: Shield, title: 'Study Vault', desc: 'Save your personal study materials privately and access them anytime.' },
  { icon: GraduationCap, title: 'Progress Tracking', desc: 'Track your study time, downloads, and test performance with beautiful charts.' },
  { icon: Heart, title: '100% Free Forever', desc: 'All resources are completely free. No hidden charges, no premium locks.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-hero min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium" style={{ color: 'hsl(0 0% 100%)' }}>100% Free Study Materials</span>
            </motion.div>

            <motion.h1 variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold font-display mb-6 tracking-tight">
              <span style={{ color: 'hsl(0 0% 100%)' }}>Rankers </span>
              <span className="text-gradient">Star</span>
            </motion.h1>

            <motion.p variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-xl md:text-2xl font-medium mb-4" style={{ color: 'hsl(220 15% 80%)' }}>
              Your Ultimate Free Study Companion for JEE, NEET & Board Exams
            </motion.p>

            <motion.p variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'hsl(220 15% 60%)' }}>
              Access premium quality lectures, books, PYQs, notes, and AI-powered study tools — all completely free. 
              Join thousands of students on their journey to crack competitive exams.
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group min-w-[220px]">
                <Zap className="w-5 h-5" />
                Start Studying Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="min-w-[220px]">
                <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer">
                  <Send className="w-5 h-5" />
                  Join Telegram
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }}
                className="hero-card rounded-xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                <stat.icon className={`w-7 h-7 mx-auto mb-3 ${stat.color}`} />
                <div className="text-3xl font-bold font-display" style={{ color: 'hsl(0 0% 100%)' }}>{stat.value}</div>
                <div className="text-sm mt-1" style={{ color: 'hsl(220 15% 60%)' }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-hero relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold font-display mb-4" style={{ color: 'hsl(0 0% 100%)' }}>
              Everything You Need to <span className="text-gradient">Crack It</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(220 15% 60%)' }}>
              From study materials to AI-powered test practice, Rankers Star has everything to boost your preparation.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} transition={{ duration: 0.5 }}
                className="hero-card rounded-2xl p-8 group hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3" style={{ color: 'hsl(0 0% 100%)' }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: 'hsl(220 15% 60%)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-24 bg-hero relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-4xl mx-auto text-center">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold font-display mb-6" style={{ color: 'hsl(0 0% 100%)' }}>
              About <span className="text-gradient">Us</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed mb-6" style={{ color: 'hsl(220 15% 70%)' }}>
              Rankers Star was born from a simple belief: <strong style={{ color: 'hsl(0 0% 100%)' }}>quality education should be accessible to everyone</strong>, 
              regardless of their financial background. We are a community-driven platform built by students, for students.
            </motion.p>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed mb-6" style={{ color: 'hsl(220 15% 70%)' }}>
              Our team curates the best study materials from across the internet — lectures from top educators, 
              comprehensive notes, previous year questions with solutions, and reference books — and makes them 
              available in one organized platform, completely free of charge.
            </motion.p>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed" style={{ color: 'hsl(220 15% 70%)' }}>
              With AI-powered tools like RankerPulse chatbot and CBT-mode mock tests that mirror actual exam patterns, 
              we're not just providing materials — we're building a complete ecosystem for exam preparation.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Our Goal */}
      <section className="py-24 bg-hero relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-4xl mx-auto">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold font-display mb-10 text-center" style={{ color: 'hsl(0 0% 100%)' }}>
              Our <span className="text-gradient">Mission</span>
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Target, title: 'Democratize Education', desc: 'Make premium study resources available to every student in India, regardless of economic status.' },
                { icon: Users, title: 'Build Community', desc: 'Create a supportive community where students help each other grow through our Telegram channel.' },
                { icon: GraduationCap, title: 'Maximize Results', desc: 'Help students achieve their dream college through organized materials and smart AI tools.' },
              ].map((goal) => (
                <motion.div key={goal.title} variants={fadeUp}
                  className="hero-card rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <goal.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3" style={{ color: 'hsl(0 0% 100%)' }}>{goal.title}</h3>
                  <p style={{ color: 'hsl(220 15% 60%)' }}>{goal.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-hero relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-3xl mx-auto hero-card rounded-3xl p-12 border-primary/20">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: 'hsl(0 0% 100%)' }}>
              Ready to Start Your Journey?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg mb-8" style={{ color: 'hsl(220 15% 60%)' }}>
              Join thousands of students who are already using Rankers Star to prepare smarter, not harder.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group animate-pulse-glow">
                <Zap className="w-5 h-5" />
                Start Studying Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hero border-t border-border/20 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <h3 className="text-2xl font-bold font-display mb-2">
                <span style={{ color: 'hsl(0 0% 100%)' }}>Rankers </span><span className="text-gradient">Star</span>
              </h3>
              <p className="text-sm" style={{ color: 'hsl(220 15% 60%)' }}>
                Your free study companion for JEE, NEET & Board Exams.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3" style={{ color: 'hsl(0 0% 100%)' }}>Quick Links</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'hsl(220 15% 60%)' }}>
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a></li>
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/adsense" className="hover:text-primary transition-colors">AdSense Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3" style={{ color: 'hsl(0 0% 100%)' }}>Connect With Us</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'hsl(220 15% 60%)' }}>
                <li>
                  <a href="mailto:studyspacerankers@gmail.com" className="hover:text-primary transition-colors">
                    📧 studyspacerankers@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    ✈️ Telegram Channel
                  </a>
                </li>
              </ul>
              <p className="text-xs mt-4" style={{ color: 'hsl(220 15% 50%)' }}>
                All announcements, requests and discussions happen on our Telegram channel.
              </p>
            </div>
          </div>
          <div className="border-t border-border/20 pt-6 text-center text-sm" style={{ color: 'hsl(220 15% 50%)' }}>
            © {new Date().getFullYear()} Rankers Star. All rights reserved. Made with ❤️ for students.
          </div>
        </div>
      </footer>
    </div>
  );
}
