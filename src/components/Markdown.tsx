/*  src/components/Markdown.tsx  */
import ReactMarkdown            from 'react-markdown';
import remarkGfm                from 'remark-gfm';
import type { ComponentProps }  from 'react';

/* Tailwind-flavoured replacements for common tags */
const T = {
  h1: (p: ComponentProps<'h1'>) => <h2 {...p} className="mt-6 mb-3 text-2xl font-semibold text-brand-700" />,
  h2: (p: ComponentProps<'h2'>) => <h3 {...p} className="mt-5 mb-2 text-xl font-semibold text-brand-700" />,
  h3: (p: ComponentProps<'h3'>) => <h4 {...p} className="mt-4 mb-2 text-lg  font-semibold" />,
  p : (p: ComponentProps<'p'>)  => <p  {...p} className="mb-4 leading-relaxed" />,

  table: (p: ComponentProps<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table {...p} className="min-w-full text-sm border border-gray-200" />
    </div>
  ),
  thead: (p: ComponentProps<'thead'>) => <thead {...p} className="bg-gray-100" />,
  th   : (p: ComponentProps<'th'>)    => <th {...p} className="px-3 py-1 border font-semibold" />,
  td   : (p: ComponentProps<'td'>)    => <td {...p} className="px-3 py-1 border" />,

  ul: (p: ComponentProps<'ul'>) => <ul {...p} className="list-disc pl-6 space-y-1" />,
  ol: (p: ComponentProps<'ol'>) => <ol {...p} className="list-decimal pl-6 space-y-1" />,
};

export const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={T as any}
    linkTarget="_blank"
  >
    {children}
  </ReactMarkdown>
);
