import { Button } from "@sparkyidea/ui/components/button";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/layouts/mode-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-60 w-full border-border/40 border-b bg-background">
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
          <Link href="/charts">Charts</Link>
        </nav>
        <nav className="flex flex-1 items-center md:justify-end">
          {/* <Button variant="ghost" size="icon" className="size-8" asChild>
						<Link
							aria-label="GitHub repo"
							href={siteConfig.links.github}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Icons.gitHub className="size-4" aria-hidden="true" />
						</Link>
					</Button> */}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
