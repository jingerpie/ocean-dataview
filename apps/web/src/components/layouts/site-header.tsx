import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/layouts/mode-toggle";

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
			<div className="container flex h-14 items-center">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					render={<Link href="/" />}
					nativeButton={false}
				>
					<LayoutGrid />
				</Button>
				<nav className="flex w-full items-center gap-4 text-sm">
					{/* <Link href="/simple">Simple</Link> */}
					{/* <Link href="/group">Group</Link> */}
					<Link href="/pagination">Pagination</Link>
					<Link href="/group-pagination">Group Pagination</Link>
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
