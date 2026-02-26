import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const proseClasses = `
  prose prose-invert max-w-none
  prose-headings:text-foreground prose-headings:font-semibold
  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border-light/50 prose-h2:pb-2
  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
  prose-p:text-muted-light prose-p:leading-relaxed prose-p:my-4
  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
  prose-ul:my-4 prose-ol:my-4
  prose-li:text-muted-light prose-li:my-1
  prose-strong:text-foreground
`;

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`${proseClasses} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
