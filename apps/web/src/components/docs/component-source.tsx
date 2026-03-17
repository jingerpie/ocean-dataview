import path from "node:path";
import { highlight } from "fumadocs-core/highlight";
import { transformerIcon } from "fumadocs-core/mdx-plugins/rehype-code.core";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { getLanguageFromPath, readFileFromRoot } from "@/lib/docs/read-file";

interface ComponentSourceProps {
  className?: string;
  src: string;
  title?: string;
}

export async function ComponentSource({
  src,
  title,
  className,
}: ComponentSourceProps) {
  const code = await readFileFromRoot(src);

  if (!code) {
    return (
      <div className="my-4 rounded-lg border border-fd-destructive/50 bg-fd-destructive/10 p-4 text-fd-destructive">
        Failed to load source: {src}
      </div>
    );
  }

  const lang = getLanguageFromPath(src);
  const displayTitle = title || path.basename(src);

  // Use transformerIcon to inject icon into pre.properties
  // Then use a custom Pre that forwards the icon to CodeBlock
  const rendered = await highlight(code, {
    lang,
    transformers: [transformerIcon()],
    components: {
      pre: (props) => (
        <CodeBlock className={className} icon={props.icon} title={displayTitle}>
          <Pre {...props} />
        </CodeBlock>
      ),
    },
  });

  return rendered;
}
