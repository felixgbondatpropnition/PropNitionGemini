/*  src/components/Markdown.tsx
    --------------------------------------------------------------
    Renders Gemini / Markdown safely – *without* remark-gfm.
    (Tables will be shown as plain text, but nothing can crash.)
----------------------------------------------------------------*/

import ReactMarkdown from 'react-markdown';

/* helper: join tailwind classes */
const cx = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/*  Tailwind-flavoured replacements  */
const MD: Record<string, any> = {
  /* headings */
  h1: (p: any) => <h2 {...p} className={cx('mt-6 mb-3 text-2xl font-semibold text-brand-700', p.className)} />,
  h2: (p: any) => <h3 {...p} className={cx('mt-5 mb-2 text-xl font-semibold text-brand-700', p.className)} />,
  h3: (p: any) => <h4 {...p} className={cx('mt-4 mb-2 text-lg font-semibold',               p.className)} />,

  /* paragraph + lists */
  p : (p: any) => <p  {...p} className={cx('mb-4 leading-relaxed', p.className)} />,
  ul: (p: any) => <ul {...p} className={cx('list-disc pl-6 space-y-1', p.className)} />,
  ol: (p: any) => <ol {...p} className={cx('list-decimal pl-6 space-y-1', p.className)} />,
};

export const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown components={MD as any} linkTarget="_blank">
    {children}
  </ReactMarkdown>
);
