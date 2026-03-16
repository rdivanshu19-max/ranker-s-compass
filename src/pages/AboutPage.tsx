import { motion } from 'framer-motion';
import { Target, Users, GraduationCap, BookOpen, Brain, Shield, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">About <span className="text-gradient">Rankers Star</span></h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Who We Are</h2>
        <p className="text-muted-foreground leading-relaxed">
          Rankers Star is a community-driven, 100% free educational platform designed specifically for JEE, NEET, and Board exam aspirants. 
          We believe every student deserves access to the best study materials without any financial barrier.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Our platform curates premium lectures, books, PYQs, handwritten notes, and video tutorials from the best educators across India. 
          Everything is organized, categorized, and made easily accessible through our beautiful web application.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Our Mission</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex gap-3"><GraduationCap className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Democratize education by providing free, high-quality study materials</li>
          <li className="flex gap-3"><Users className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Build a supportive student community through our Telegram channel</li>
          <li className="flex gap-3"><Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Leverage AI to create personalized study experiences and smart test practice</li>
          <li className="flex gap-3"><Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Keep everything free forever — no premium locks, no hidden charges</li>
        </ul>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> What We Offer</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {['500+ Curated Materials', 'AI-Powered Doubt Solving', 'CBT Mock Tests (JEE/NEET)', 'Personal Study Vault', 'Weekly Progress Tracking', 'Community Support'].map(f => (
            <div key={f} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display">Contact Us</h2>
        <div className="flex flex-col gap-3">
          <Button variant="outline" asChild>
            <a href="mailto:studyspacerankers@gmail.com"><Mail className="w-4 h-4 mr-2" /> studyspacerankers@gmail.com</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer"><Send className="w-4 h-4 mr-2" /> Telegram Channel</a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
