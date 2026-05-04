import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface Props { children: string; className?: string; }

/**
 * Normalises common AI math output so KaTeX can render it cleanly.
 *  - keeps proper LaTeX inside $...$ / $$...$$
 *  - converts ChatGPT-style \( \) and \[ \] to $...$ / $$...$$
 *  - strips stray currency-style $ that aren't math (e.g. "$5 today").
 */
function preprocess(src: string): string {
  if (!src) return '';
  let s = src;
  // \( ... \)  ->  $...$
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`);
  // \[ ... \]  ->  $$...$$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$$${m}$$`);
  // Escape lone currency $ followed by a digit (avoid false math)
  s = s.replace(/(^|[\s(])\$(\d)/g, '$1\\$$$2');
  return s;
}

export default function MarkdownMath({ children, className }: Props) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {preprocess(children)}
      </ReactMarkdown>
    </div>
  );
}
