import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { GitHubLink } from "@/components/layouts/github-link";
import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background">
      <div className="container flex h-14 items-center">
        <Button
          className="size-8"
          nativeButton={false}
          render={<Link href="/" />}
          size="icon"
          variant="ghost"
        >
          <LayoutGrid />
        </Button>
        <nav className="flex w-full items-center gap-4 text-sm">
          <Link href="/table">Table</Link>
          <Link href="/list">List</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/board">Board</Link>
        </nav>
        <div className="flex flex-1 items-center gap-2 md:justify-end">
          <GitHubLink />
          <Separator className="self-center! h-4" orientation="vertical" />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
