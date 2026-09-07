import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function SafeLink(props: ComponentPropsWithoutRef<"a">) {
  return <a {...props} rel="noreferrer noopener" target="_blank" className="underline underline-offset-4" />;
}

export function ReviewMarkdown({ source }: { source: string }) {
  return (
    <div className="max-w-prose space-y-3 leading-7 [&_blockquote]:border-l [&_blockquote]:border-[#bdbdbd] [&_blockquote]:pl-4 [&_code]:bg-black/[0.05] [&_code]:px-1 [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:bg-black/[0.05] [&_pre]:p-3 [&_ul]:list-disc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        allowedElements={["p", "strong", "em", "del", "ul", "ol", "li", "blockquote", "code", "pre", "a", "br", "hr"]}
        unwrapDisallowed
        components={{ a: SafeLink }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
