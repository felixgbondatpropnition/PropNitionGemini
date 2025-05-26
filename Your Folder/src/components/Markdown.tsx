/*  src/components/Markdown.tsx
    --------------------------------------------------------------
    Renders Gemini’s Markdown with Tailwind styling.
    (Now drops the `node` helper-prop before hitting real DOM.)  */

import ReactMarkdown                from 'react-markdown';
import remarkGfm                    from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

/* utility ------------------------------------------------------*/
const cx = (...c: string[]) => c.filter(Boolean).join(' ');

/* helper to strip `node` prop */
function stripNode<T extends { node?: unknown }>(props: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node, ...rest } = props;
  return rest as Omit<T, 'node'>;
}

/* Tailwind flavoured elements ---------------------------------*/
const M = {
  /* headings */
  h1: (p: any) => (
    <h2 {...stripNode(p)} className={cx('mt-6 mb-3 text-2xl font-semibold text-brand-700', p.className)} />
  ),
  h2: (p: any) => (
    <h3 {...stripNode(p)} className={cx('mt-5 mb-2 text-xl font-semibold text-brand-700', p.className)} />
  ),
  h3: (p: any) => (
    <h4 {...stripNode(p)} className={cx('mt-4 mb-2 text-lg font-semibold', p.className)} />
  ),

  /* paragraph */
  p:  (p: any) => (
    <p  {...stripNode(p)} className={cx('mb-4 leading-relaxed', p.className)} />
  ),

  /* lists */
  ul: (p: any) => (
    <ul {...stripNode(p)} className={cx('list-disc pl-6 space-y-1', p.className)} />
  ),
  ol: (p: any) => (
    <ol {...stripNode(p)} className={cx('list-decimal pl-6 space-y-1', p.className)} />
  ),

  /* table + parts */
  table: ({ children, ...r }: ComponentPropsWithoutRef<'table'> & { node?: unknown }) => (
    <div className="my-4 overflow-x-auto">
      <table {...stripNode(r)} className={cx('min-w-full text-sm border border-gray-200', r.className)}>
        {children}
      </table>
    </div>
  ),
  thead: (p: any) => (
    <thead {...stripNode(p)} className={cx('bg-gray-100', p.className)} />
  ),
  th: (p: any) => (
    <th {...stripNode(p)} className={cx('px-3 py-1 border font-semibold', p.className)} />
  ),
  td: (p: any) => (
    <td {...stripNode(p)} className={cx('px-3 py-1 border', p.className)} />
  ),
};

export const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={M as any}
    linkTarget="_blank"
  >
    {children}
  </ReactMarkdown>
);
