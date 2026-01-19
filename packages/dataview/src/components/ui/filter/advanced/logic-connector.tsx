"use client";

import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@ocean-dataview/dataview/components/ui/item";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../select";

const LOGIC_OPTIONS = [
	{ value: "and", label: "And", description: "All filters must match" },
	{ value: "or", label: "Or", description: "At least one filter must match" },
] as const;

interface LogicConnectorProps {
	/** Whether this is the first rule (shows "Where" label) */
	isFirst: boolean;
	/** Whether this is the second rule (shows dropdown, can change logic) */
	isSecond: boolean;
	/** Current logic operator */
	logic: "and" | "or";
	/** Callback when logic changes */
	onLogicChange: (logic: "and" | "or") => void;
	/** Additional class names */
	className?: string;
}

/**
 * Logic connector for filter rules.
 * - First rule shows static "Where" label
 * - Second rule shows "And" / "Or" dropdown (can change logic for entire group)
 * - Third+ rules show static "And" / "Or" label
 */
export function LogicConnector({
	isFirst,
	isSecond,
	logic,
	onLogicChange,
	className,
}: LogicConnectorProps) {
	// First item shows "Where"
	if (isFirst) {
		return (
			<span
				className={cn(
					"inline-flex min-w-17 items-center justify-end pr-2 font-medium text-muted-foreground text-sm",
					className
				)}
			>
				Where
			</span>
		);
	}

	// Third+ items show static label
	if (!isSecond) {
		return (
			<span
				className={cn(
					"inline-flex min-w-17 items-center justify-end pr-2 font-medium text-muted-foreground text-sm capitalize",
					className
				)}
			>
				{logic}
			</span>
		);
	}

	// Second item shows select
	return (
		<Select
			items={LOGIC_OPTIONS}
			onValueChange={(value) => onLogicChange(value as "and" | "or")}
			value={logic}
		>
			<SelectTrigger className="min-w-17" size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="start" className="w-auto">
				{LOGIC_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<Item className="w-full p-0" size="xs">
							<ItemContent className="gap-0">
								<ItemTitle>{option.label}</ItemTitle>
								<ItemDescription className="text-xs">
									{option.description}
								</ItemDescription>
							</ItemContent>
						</Item>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
