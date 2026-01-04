import { cn } from "@ocean-dataview/ui/lib/utils";

function AspectRatio({
	ratio,
	className,
	...props
}: React.ComponentProps<"div"> & { ratio: number }) {
	return (
		<div
			data-slot="aspect-ratio"
			style={
				{
					"--ratio": ratio,
				} as React.CSSProperties
			}
			className={cn("relative aspect-(--ratio)", className)}
			{...props}
		/>
	);
}

export { AspectRatio };
