import { Button } from "@sparkyidea/ui/components/button";
import { Skeleton } from "@sparkyidea/ui/components/skeleton";
import Link from "next/link";
import { Suspense } from "react";
import { Icons } from "@/components/icons";

const GITHUB_REPO = "jingerpie/ocean-dataview";
const TRAILING_ZERO_REGEX = /\.0$/;

export function GitHubLink() {
  return (
    <Button
      className="h-8 shadow-none"
      nativeButton={false}
      render={
        <Link
          href={`https://github.com/${GITHUB_REPO}`}
          rel="noreferrer"
          target="_blank"
        />
      }
      size="sm"
      variant="ghost"
    >
      <Icons.gitHub className="size-4" />
      <Suspense fallback={<Skeleton className="h-4 w-10" />}>
        <StarsCount />
      </Suspense>
    </Button>
  );
}

async function StarsCount() {
  const data = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
    next: { revalidate: 86_400 },
  });
  const json = await data.json();

  const count = json.stargazers_count;
  if (count === undefined) {
    return null;
  }

  const formattedCount =
    count >= 1000
      ? `${(count / 1000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}k`
      : count.toLocaleString();

  return (
    <span className="w-fit text-muted-foreground text-xs tabular-nums">
      {formattedCount}
    </span>
  );
}
