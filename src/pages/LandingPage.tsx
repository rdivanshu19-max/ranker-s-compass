import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, BookOpen, Users, Download, Star, ArrowRight, Send, Sparkles, Target, Brain, GraduationCap, Shield, Heart, Quote, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } };

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

const testimonials = [
  { text: "The best thing about Ranker Resource is that everything you need is available in one place. You don't have to wander anywhere for materials. Everything is well organized and customized, which makes studying much easier ❤️", name: "Saurabh Singh" },
  { text: "Ranker Resource provides study materials that are hard to find anywhere else. The admin also keeps students updated with useful offers and genuinely tries to fulfill everyone's requests. ❤️", name: "Abhiyank" },
  { text: "The test series and the batches that you provided here really helped me in my preparation and helped in improving my performance ❤️", name: "Aditya Kumar" },
];

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() * 2 + 0.5, a: Math.random() * 0.5 + 0.1 });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(24, 95%, 53%, ${p.a})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `hsla(24, 95%, 53%, ${0.08 * (1 - dist / 120)})`; ctx.stroke(); }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Floating theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button variant="ghost" size="icon" onClick={toggleTheme}
          className="rounded-full bg-card/80 backdrop-blur-lg border border-border shadow-lg">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>

      {/* Hero */}
      <section className="relative bg-hero min-h-screen flex items-center justify-center overflow-hidden">
        <Particles />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={scaleIn} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/30 bg-primary/10 mb-6 sm:mb-8 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-foreground">100% Free Study Materials — No Hidden Charges</span>
            </motion.div>

            <motion.h1 variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-display mb-4 sm:mb-6 tracking-tight">
              <span className="text-foreground">Rankers </span>
              <span className="text-gradient">Star</span>
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                className="inline-block ml-2 sm:ml-3">⭐</motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4 text-muted-foreground">
              Your Ultimate Free Study Companion for JEE, NEET & Board Exams
            </motion.p>

            <motion.p variants={fadeUp} transition={{ duration: 0.8 }}
              className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 text-muted-foreground">
              Access premium quality lectures, books, PYQs, notes, and AI-powered study tools — all completely free.
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group w-full sm:w-auto min-w-[200px] animate-pulse-glow">
                <Zap className="w-5 h-5" /> Start Studying Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="w-full sm:w-auto min-w-[200px]">
                <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer">
                  <Send className="w-5 h-5" /> Join Telegram
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-20 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={scaleIn} transition={{ duration: 0.5 }}
                className="hero-card rounded-xl p-4 sm:p-6 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-2">
                <stat.icon className={`w-5 sm:w-7 h-5 sm:h-7 mx-auto mb-2 sm:mb-3 ${stat.color}`} />
                <div className="text-2xl sm:text-3xl font-bold font-display text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm mt-1 text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block">
          <div className="w-6 h-10 rounded-full border-2 border-primary/40 flex items-start justify-center p-1.5">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-hero relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" /></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10 sm:mb-16">
            <motion.div variants={scaleIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4 sm:mb-6">
              <span className="text-xs font-medium text-primary">FEATURES</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-3 sm:mb-4 text-foreground">
              Everything You Need to <span className="text-gradient">Crack It</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base sm:text-lg max-w-2xl mx-auto text-muted-foreground">
              From study materials to AI-powered test practice, Rankers Star has everything to boost your preparation.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} transition={{ duration: 0.5 }}
                className="hero-card rounded-2xl p-6 sm:p-8 group hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all" />
                <div className="relative z-10">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 sm:w-7 h-6 sm:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display mb-2 sm:mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-hero relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" /></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10 sm:mb-16">
            <motion.div variants={scaleIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4 sm:mb-6">
              <span className="text-xs font-medium text-primary">TESTIMONIALS</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-4 text-foreground">
              Loved by <span className="text-gradient">Students</span>
            </motion.h2>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            <motion.div key={currentTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="hero-card rounded-2xl p-6 sm:p-8 md:p-10 text-center relative">
              <Quote className="w-8 sm:w-10 h-8 sm:h-10 text-primary/30 mx-auto mb-4 sm:mb-6" />
              <p className="text-base sm:text-lg md:text-xl leading-relaxed mb-4 sm:mb-6 italic text-muted-foreground">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display">
                  {testimonials[currentTestimonial].name[0]}
                </div>
                <span className="font-bold font-display text-foreground">{testimonials[currentTestimonial].name}</span>
              </div>
            </motion.div>
            <div className="flex justify-center gap-3 mt-4 sm:mt-6">
              <Button variant="ghost" size="icon" className="rounded-full border border-border/30"
                onClick={() => setCurrentTestimonial(p => (p - 1 + testimonials.length) % testimonials.length)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrentTestimonial(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentTestimonial ? 'bg-primary w-6' : 'bg-primary/30'}`} />
                ))}
              </div>
              <Button variant="ghost" size="icon" className="rounded-full border border-border/30"
                onClick={() => setCurrentTestimonial(p => (p + 1) % testimonials.length)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 sm:py-24 bg-hero relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto text-center">
            <motion.div variants={scaleIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4 sm:mb-6">
              <span className="text-xs font-medium text-primary">ABOUT US</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-4 sm:mb-6 text-foreground">
              About <span className="text-gradient">Us</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 text-muted-foreground">
              Rankers Star was born from a simple belief: <strong className="text-foreground">quality education should be accessible to everyone</strong>,
              regardless of their financial background. We are a community-driven platform built by students, for students.
            </motion.p>
            <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 text-muted-foreground">
              Our team curates the best study materials from across the internet and makes them available in one organized platform, completely free of charge.
            </motion.p>
            <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              With AI-powered tools like RankerPulse chatbot and CBT-mode mock tests, we're building a complete ecosystem for exam preparation.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24 bg-hero relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <motion.div variants={scaleIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4 sm:mb-6">
                <span className="text-xs font-medium text-primary">OUR MISSION</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-foreground">
                Our <span className="text-gradient">Mission</span>
              </motion.h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: Target, title: 'Democratize Education', desc: 'Make premium study resources available to every student in India.' },
                { icon: Users, title: 'Build Community', desc: 'Create a supportive community through our Telegram channel.' },
                { icon: GraduationCap, title: 'Maximize Results', desc: 'Help students achieve their dream college through smart tools.' },
              ].map((goal) => (
                <motion.div key={goal.title} variants={fadeUp}
                  className="hero-card rounded-2xl p-6 sm:p-8 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                    <goal.icon className="w-7 sm:w-8 h-7 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display mb-2 sm:mb-3 text-foreground">{goal.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{goal.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-hero relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-3xl mx-auto hero-card rounded-3xl p-8 sm:p-12 border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative z-10">
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mb-3 sm:mb-4 text-foreground">
                Ready to Start Your Journey?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base sm:text-lg mb-6 sm:mb-8 text-muted-foreground">
                Join thousands of students who are already using Rankers Star to prepare smarter, not harder.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group animate-pulse-glow w-full sm:w-auto">
                  <Zap className="w-5 h-5" /> Start Studying Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hero border-t border-border/20 py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-display mb-2">
                <span className="text-foreground">Rankers </span><span className="text-gradient">Star</span>
              </h3>
              <p className="text-sm text-muted-foreground">Your free study companion for JEE, NEET & Board Exams.</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-foreground">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a></li>
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/adsense" className="hover:text-primary transition-colors">AdSense Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-foreground">Connect With Us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:studyspacerankers@gmail.com" className="hover:text-primary transition-colors">📧 studyspacerankers@gmail.com</a></li>
                <li><a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">✈️ Telegram Channel</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Rankers Star. All rights reserved. Made with ❤️ for students.
          </div>
        </div>
      </footer>
    </div>
  );
}
