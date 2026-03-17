import { motion } from 'framer-motion';
import { Heart, Mail, Send, DollarSign, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import upiQrImage from '@/assets/upi-qr.jpg';

export default function ContributePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display">Contribute to <span className="text-gradient">Rankers Star</span> 💛</h1>
        <p className="text-muted-foreground mt-1">Help us help more students!</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Share Study Materials</h2>
        <p className="text-muted-foreground">
          Have quality study materials like notes, PYQs, or book PDFs? Share them with thousands of students!
          Contact us via email or Telegram to contribute your materials.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="default" asChild>
            <a href="mailto:studyspacerankers@gmail.com"><Mail className="w-4 h-4 mr-1" /> Email Us</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer"><Send className="w-4 h-4 mr-1" /> Telegram</a>
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-bold font-display flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Financial Support</h2>
        <p className="text-muted-foreground">
          Running Rankers Star requires server costs, domain charges, and time. If you'd like to support us financially
          to keep this platform free for everyone, you can contribute via UPI or reach out to us!
        </p>

        {/* UPI Section */}
        <div className="bg-muted/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h3 className="font-bold font-display">Pay via UPI</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img src={upiQrImage} alt="UPI QR Code" className="w-56 h-56 rounded-xl object-contain border border-border" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">UPI ID</p>
              <p className="font-mono font-bold text-primary text-lg select-all">rathordivyanshu@fam</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="default" asChild>
            <a href="mailto:studyspacerankers@gmail.com"><Mail className="w-4 h-4 mr-1" /> Contact for Donation</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://t.me/freematerialjeeneet" target="_blank" rel="noopener noreferrer"><Send className="w-4 h-4 mr-1" /> Reach via Telegram</a>
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-primary/5 rounded-2xl border border-primary/20 p-6 text-center">
        <p className="text-lg font-medium">Every contribution — whether materials or money — helps a student somewhere. 🙏</p>
      </motion.div>
    </div>
  );
}
