import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Sparkles, AlertTriangle, ImagePlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import AILoadingScreen from '@/components/AILoadingScreen';
import { useAILimit } from '@/hooks/useAILimit';

type Msg = { role: 'user' | 'assistant'; content: string; image?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const normalizeMathText = (text: string) => {
  return text
    .replace(/\$\$([^$]+)\$\$/g, '$1').replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '∛($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\vec\{([^}]+)\}/g, '$1→').replace(/\\hat\{([^}]+)\}/g, '$1̂')
    .replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\div/g, '÷').replace(/\\pm/g, '±')
    .replace(/\\pi/g, 'π').replace(/\\theta/g, 'θ').replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ').replace(/\\delta/g, 'δ').replace(/\\lambda/g, 'λ').replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ').replace(/\\omega/g, 'ω').replace(/\\phi/g, 'φ')
    .replace(/\\Delta/g, 'Δ').replace(/\\Sigma/g, 'Σ').replace(/\\Omega/g, 'Ω')
    .replace(/\\infty/g, '∞').replace(/\\int/g, '∫').replace(/\\sum/g, 'Σ').replace(/\\partial/g, '∂')
    .replace(/\\approx/g, '≈').replace(/\\equiv/g, '≡').replace(/\\geq/g, '≥').replace(/\\leq/g, '≤')
    .replace(/\\neq/g, '≠').replace(/\\to/g, '→').replace(/\\Rightarrow/g, '⇒').replace(/\\therefore/g, '∴')
    .replace(/\\degree/g, '°').replace(/\\circ/g, '°')
    .replace(/\^{(\d+)}/g, (_, p) => p.split('').map((c: string) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)] || c).join(''))
    .replace(/_{(\d+)}/g, (_, p) => p.split('').map((c: string) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(c)] || c).join(''))
    .replace(/\^(\d)/g, (_, c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)] || c)
    .replace(/_(\d)/g, (_, c) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(c)] || c)
    .replace(/\\[a-zA-Z]+/g, '').replace(/\{([^}]*)\}/g, '$1').trim();
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export default function AIChatWidget() {
  const { session } = useAuth();
  const { remaining, limit, refresh: refreshLimit, resetIn } = useAILimit('ai_chat');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm **RankerPulse** 🚀 — your AI study assistant!\n\nI can help with:\n- 📚 Solving doubts (text or image)\n- 🧠 JEE/NEET concepts\n- 🎯 Study strategy\n- 📝 Quick revision\n\nSend a photo of your question or type it!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeader = useMemo(() => session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, [session?.access_token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(await toBase64(file));
  };

  const removeImage = () => { setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const send = async () => {
    if ((!input.trim() && !imagePreview) || loading) return;
    const userContent = input.trim() || (imagePreview ? 'Please analyze this image and solve the question.' : '');
    const userMsg: Msg = { role: 'user', content: userContent, image: imagePreview || undefined };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    const sentImage = imagePreview;
    removeImage();
    setLoading(true);
    let assistantSoFar = '';

    // Build API messages
    const apiMessages = newMsgs.map(m => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: m.image } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${authHeader}` },
        body: JSON.stringify({ messages: apiMessages, hasImage: !!sentImage }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || 'Failed'); }
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx); buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const normalized = normalizeMathText(assistantSoFar);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > newMsgs.length)
                  return prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: normalized } : msg);
                return [...prev, { role: 'assistant', content: normalized }];
              });
            }
          } catch { buffer = `${line}\n${buffer}`; break; }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center shadow-lg hover:shadow-primary/30 transition-all animate-pulse-glow">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-20 right-4 z-50 w-[min(560px,calc(100vw-1rem))] h-[min(82vh,750px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-sm">RankerPulse AI</h3>
                  <p className="text-xs text-muted-foreground">Text + Image doubt solving</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
            </div>

            <div className="px-4 pt-2 text-[11px] text-muted-foreground border-b border-border/70 pb-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" /> AI-generated responses — verify critical formulas from trusted books.
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                    {m.image && (
                      <img src={m.image} alt="Question" className="rounded-lg max-h-40 mb-2 border border-border/30" />
                    )}
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-1 items-center text-muted-foreground text-sm">
                  <Bot className="w-4 h-4" /><span className="animate-pulse">Thinking...</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border space-y-2">
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-16 rounded-lg border border-border" />
                  <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">✕</button>
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your doubt or send a photo..." className="flex-1 text-sm" disabled={loading} />
                <Button type="submit" size="icon" disabled={loading || (!input.trim() && !imagePreview)}><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
