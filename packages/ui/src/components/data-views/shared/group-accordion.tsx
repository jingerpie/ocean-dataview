"use client";

import { cn } from "@ocean-dataview/ui/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronRightIcon } from "lucide-react";
import type * as React from "react";

function GroupAccordion({
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function GroupAccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(
				"border-b last:border-b-0",
				"first:[&_[data-slot=accordion-trigger]]:!pt-0",
				className,
			)}
			{...props}
		/>
	);
}

function GroupAccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"sticky left-0 z-5",
					"flex flex-1 items-center gap-2 rounded-md py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90",
					className,
				)}
				{...props}
			>
				<ChevronRightIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
				{children}
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function GroupAccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			{...props}
		>
			<div className={cn("flex flex-col gap-3 pt-0 pb-4", className)}>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export {
	GroupAccordion,
	GroupAccordionItem,
	GroupAccordionTrigger,
	GroupAccordionContent,
};
