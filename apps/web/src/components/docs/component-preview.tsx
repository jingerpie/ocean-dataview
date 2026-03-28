import { highlight } from "fumadocs-core/highlight";
import { transformerIcon } from "fumadocs-core/mdx-plugins/rehype-code.core";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import type { ReactNode } from "react";
import { getLanguageFromPath, readFileFromRoot } from "@/lib/docs/read-file";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps {
  children: ReactNode;
  className?: string;
  hideCode?: boolean;
  previewClassName?: string;
  src: string;
}

export async function ComponentPreview({
  children,
  src,
  className,
  previewClassName,
  hideCode = false,
}: ComponentPreviewProps) {
  const code = await readFileFromRoot(src);
  const lang = getLanguageFromPath(src);

  // Use transformerIcon to inject icon, then forward to CodeBlock via custom pre
  const rendered = code
    ? await highlight(code, {
        lang,
        transformers: [transformerIcon()],
        components: {
          pre: (props) => (
            <CodeBlock
              className="border-t [&_figure]:my-0 [&_figure]:rounded-t-none"
              icon={props.icon}
            >
              <Pre {...props} />
            </CodeBlock>
          ),
        },
      })
    : null;

  return (
    <div
      className={cn(
        "not-prose my-4 flex flex-col overflow-hidden rounded-xl border",
        className
      )}
    >
      {/* Preview */}
      <div
        className={cn(
          "flex min-h-48 w-full items-center justify-center p-6",
          previewClassName
        )}
      >
        {children}
      </div>

      {/* Code */}
      {!hideCode && rendered}
    </div>
  );
}
