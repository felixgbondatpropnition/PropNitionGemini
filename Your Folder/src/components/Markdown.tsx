/*  src/components/Markdown.tsx
    --------------------------------------------------------------
    Renders Gemini’s Markdown with nice Tailwind styling.
*/

import ReactMarkdown                from 'react-markdown';
import remarkGfm                    from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

/* reusable helper */
const cls = (...c: string[]) => c.filter(Boolean).join(' ');

/* Tailwind-flavoured replacements for common tags */
const M = {
  /* headings --------------------------------------------------- */
  h1: ({ children, ...rest }: ComponentPropsWithoutRef<'h1'>) => (
    <h2 {...rest} className={cls('mt-6 mb-3 text-2xl font-semibold text-brand-700', rest.className)}>
      {children}
    </h2>
  ),
  h2: ({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) => (
    <h3 {...rest} className={cls('mt-5 mb-2 text-xl font-semibold text-brand-700', rest.className)}>
      {children}
    </h3>
  ),
  h3: ({ children, ...rest }: ComponentPropsWithoutRef<'h3'>) => (
    <h4 {...rest} className={cls('mt-4 mb-2 text-lg font-semibold', rest.className)}>
      {children}
    </h4>
  ),

  /* paragraph -------------------------------------------------- */
  p: ({ children, ...rest }: ComponentPropsWithoutRef<'p'>) => (
    <p {...rest} className={cls('mb-4 leading-relaxed', rest.className)}>
      {children}
    </p>
  ),

  /* lists ------------------------------------------------------ */
  ul: ({ children, ...rest }: ComponentPropsWithoutRef<'ul'>) => (
    <ul {...rest} className={cls('list-disc pl-6 space-y-1', rest.className)}>
      {children}
    </ul>
  ),
  ol: ({ children, ...rest }: ComponentPropsWithoutRef<'ol'>) => (
    <ol {...rest} className={cls('list-decimal pl-6 space-y-1', rest.className)}>
      {children}
    </ol>
  ),

  /* tables ----------------------------------------------------- */
  table: ({ children, ...rest }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table
        {...rest}
        className={cls('min-w-full text-sm border border-gray-200', rest.className)}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...rest }: ComponentPropsWithoutRef<'thead'>) => (
    <thead {...rest} className={cls('bg-gray-100', rest.className)}>
      {children}
    </thead>
  ),
  th: ({ children, ...rest }: ComponentPropsWithoutRef<'th'>) => (
    <th {...rest} className={cls('px-3 py-1 border font-semibold', rest.className)}>
      {children}
    </th>
  ),
  td: ({ children, ...rest }: ComponentPropsWithoutRef<'td'>) => (
    <td {...rest} className={cls('px-3 py-1 border', rest.className)}>
      {children}
    </td>
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
