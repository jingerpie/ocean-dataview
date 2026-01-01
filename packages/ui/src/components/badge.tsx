import { cn } from "@ocean-dataview/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
				secondary:
					"border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
				outline: "text-foreground hover:border-foreground",
				gray: "border-transparent bg-badge-gray text-badge-gray-foreground hover:bg-badge-gray/80",
				"gray-subtle":
					"border-transparent bg-badge-gray-subtle text-badge-gray-subtle-foreground hover:border-badge-gray-subtle-foreground",
				blue: "border-transparent bg-badge-blue text-badge-blue-foreground hover:bg-badge-blue/80",
				"blue-subtle":
					"border-transparent bg-badge-blue-subtle text-badge-blue-subtle-foreground hover:border-badge-blue-subtle-foreground",
				purple:
					"border-transparent bg-badge-purple text-badge-purple-foreground hover:bg-badge-purple/80",
				"purple-subtle":
					"border-transparent bg-badge-purple-subtle text-badge-purple-subtle-foreground hover:border-badge-purple-subtle-foreground",
				yellow:
					"border-transparent bg-badge-yellow text-badge-yellow-foreground hover:bg-badge-yellow/80",
				"yellow-subtle":
					"border-transparent bg-badge-yellow-subtle text-badge-yellow-subtle-foreground hover:border-badge-yellow-subtle-foreground",
				orange:
					"border-transparent bg-badge-orange text-badge-orange-foreground hover:bg-badge-orange/80",
				"orange-subtle":
					"border-transparent bg-badge-orange-subtle text-badge-orange-subtle-foreground hover:border-badge-orange-subtle-foreground",
				red: "border-transparent bg-badge-red text-badge-red-foreground hover:bg-badge-red/80",
				"red-subtle":
					"border-transparent bg-badge-red-subtle text-badge-red-subtle-foreground hover:border-badge-red-subtle-foreground",
				pink: "border-transparent bg-badge-pink text-badge-pink-foreground hover:bg-badge-pink/80",
				"pink-subtle":
					"border-transparent bg-badge-pink-subtle text-badge-pink-subtle-foreground hover:border-badge-pink-subtle-foreground",
				green:
					"border-transparent bg-badge-green text-badge-green-foreground hover:bg-badge-green/80",
				"green-subtle":
					"border-transparent bg-badge-green-subtle text-badge-green-subtle-foreground hover:border-badge-green-subtle-foreground",
				teal: "border-transparent bg-badge-teal text-badge-teal-foreground hover:bg-badge-teal/80",
				"teal-subtle":
					"border-transparent bg-badge-teal-subtle text-badge-teal-subtle-foreground hover:border-badge-teal-subtle-foreground",
				inverted:
					"border-transparent bg-badge-inverted text-badge-inverted-foreground hover:bg-badge-inverted/80",
			},
			size: {
				sm: "gap-[3px] px-1.5 py-0.5 text-[11px]",
				md: "gap-[4px] px-2.5 py-1 text-xs",
				lg: "gap-[6px] px-3 py-1.5 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {
	icon?: React.ReactElement<{ size?: number }>;
}

function Badge({
	className,
	variant,
	size,
	icon,
	children,
	...props
}: BadgeProps) {
	const iconSizes = {
		sm: 11,
		md: 14,
		lg: 16,
	};

	return (
		<div className={cn(badgeVariants({ variant, size }), className)} {...props}>
			{icon &&
				React.cloneElement(icon, {
					size: iconSizes[size ?? "md"],
				} as Partial<{ size: number }>)}
			{children}
		</div>
	);
}

export { Badge, badgeVariants };
