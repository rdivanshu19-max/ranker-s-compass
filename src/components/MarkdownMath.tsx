import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props { children: string; className?: string; }

function preprocess(src: string): string {
  if (!src) return '';
  let s = src;
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, '$1').replace(/\\\[([\s\S]+?)\\\]/g, '$1');
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, '$1').replace(/\$([^$\n]+)\$/g, '$1');
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
  s = s.replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)').replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  const map: Record<string, string> = { times: '×', cdot: '·', div: '÷', pm: '±', pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', phi: 'φ', Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω', infty: '∞', int: '∫', sum: 'Σ', partial: '∂', approx: '≈', equiv: '≡', geq: '≥', leq: '≤', neq: '≠', to: '→', Rightarrow: '⇒', therefore: '∴', degree: '°', circ: '°' };
  s = s.replace(/\\([A-Za-z]+)/g, (_, k) => map[k] ?? '');
  s = s.replace(/\^\{([^{}]+)\}/g, '^$1').replace(/_\{([^{}]+)\}/g, '_$1');
  s = s.replace(/[{}]/g, '').replace(/\\/g, '').replace(/\s+([,.;:])/g, '$1');
  return s;
}

export default function MarkdownMath({ children, className }: Props) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >
        {preprocess(children)}
      </ReactMarkdown>
    </div>
  );
}
