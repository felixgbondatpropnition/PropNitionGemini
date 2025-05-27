/*  src/components/Markdown.tsx
    --------------------------------------------------------------
    Renders Gemini / Markdown safely:
    • Removes every helper-prop react-markdown adds            ✅
    • Adds Tailwind styling                                    ✅
----------------------------------------------------------------*/

import ReactMarkdown from 'react-markdown';
import remarkGfm     from 'remark-gfm';

/* -------------------------------------------------------------- */
/* 1 ▸ helper – drop helper props (`node`, `data`, …) from DOM   */
const STRIP_KEYS = new Set([
  'node', 'data', 'inline', 'level', 'checked', 'ordered', 'index', 'className'
]);

function cleanProps<P extends Record<string, unknown>>(p: P) {
  const cleaned: Record<string, unknown> = {};
  for (const k in p) {
    if (!STRIP_KEYS.has(k)) cleaned[k] = p[k];
  }
  /* preserve className manually so styling still works */
  if ('className' in p) cleaned.className = (p as any).className;
  return cleaned as Omit<P, 'node' | 'data' | 'inline' | 'level' | 'checked' | 'ordered' | 'index'>;
}

/* -------------------------------------------------------------- */
/* 2 ▸ small css helper                                           */
const cx = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/* -------------------------------------------------------------- */
/* 3 ▸ Tailwind-flavoured components                              */
const MD: Record<string, any> = {
  /* headings */
  h1: (p: any) => <h2 {...cleanProps(p)} className={cx('mt-6 mb-3 text-2xl font-semibold text-brand-700', p.className)} />,
  h2: (p: any) => <h3 {...cleanProps(p)} className={cx('mt-5 mb-2 text-xl font-semibold text-brand-700', p.className)} />,
  h3: (p: any) => <h4 {...cleanProps(p)} className={cx('mt-4 mb-2 text-lg font-semibold', p.className)} />,

  /* paragraphs */
  p : (p: any) => <p  {...cleanProps(p)} className={cx('mb-4 leading-relaxed', p.className)} />,

  /* lists */
  ul: (p: any) => <ul {...cleanProps(p)} className={cx('list-disc pl-6 space-y-1', p.className)} />,
  ol: (p: any) => <ol {...cleanProps(p)} className={cx('list-decimal pl-6 space-y-1', p.className)} />,

  /* tables */
  table: (p: any) => (
    <div className="my-4 overflow-x-auto">
      <table {...cleanProps(p)} className={cx('min-w-full text-sm border border-gray-200', p.className)} />
    </div>
  ),
  thead: (p: any) => <thead {...cleanProps(p)} className={cx('bg-gray-100', p.className)} />,
  tbody: (p: any) => <tbody {...cleanProps(p)} />,
  tr   : (p: any) => <tr    {...cleanProps(p)} />,
  th   : (p: any) => <th    {...cleanProps(p)} className={cx('px-3 py-1 border font-semibold', p.className)} />,
  td   : (p: any) => <td    {...cleanProps(p)} className={cx('px-3 py-1 border',           p.className)} />,
};

/* -------------------------------------------------------------- */
/* 4 ▸ exported component                                         */
export const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={MD as any}
    linkTarget="_blank"
  >
    {children}
  </ReactMarkdown>
);
