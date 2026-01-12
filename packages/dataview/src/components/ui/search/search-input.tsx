"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

interface SearchInputProps {
	/** Current search value */
	value: string;
	/** Callback when search value changes */
	onChange: (value: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Debounce delay in milliseconds */
	debounceMs?: number;
	/** Additional class names */
	className?: string;
}

/**
 * Expandable search input that expands in place.
 * - Collapsed: Icon button only
 * - Expanded: Input field with icon + clear button
 */
export function SearchInput({
	value,
	onChange,
	placeholder = "Type to search...",
	debounceMs = 300,
	className,
}: SearchInputProps) {
	const [expanded, setExpanded] = React.useState(false);
	const [localValue, setLocalValue] = React.useState(value);
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync local value when external value changes
	React.useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Debounced onChange
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (localValue !== value) {
				onChange(localValue);
			}
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [localValue, debounceMs, onChange, value]);

	// Auto-expand when value exists
	React.useEffect(() => {
		if (value && !expanded) {
			setExpanded(true);
		}
	}, [value, expanded]);

	// Focus input when expanded
	React.useEffect(() => {
		if (expanded) {
			inputRef.current?.focus();
		}
	}, [expanded]);

	const handleExpand = () => {
		setExpanded(true);
	};

	const handleClear = () => {
		setLocalValue("");
		onChange("");
		inputRef.current?.focus();
	};

	const handleBlur = () => {
		// Collapse only if empty
		if (!localValue) {
			setExpanded(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			if (localValue) {
				handleClear();
			} else {
				setExpanded(false);
				inputRef.current?.blur();
			}
		}
	};

	// Collapsed state - just icon button
	if (!expanded) {
		return (
			<Button
				variant="ghost"
				size="sm"
				className={cn("h-8 w-8 p-0", className)}
				onClick={handleExpand}
				aria-label="Open search"
			>
				<SearchIcon className="size-4" />
			</Button>
		);
	}

	// Expanded state - input with icon
	return (
		<div
			className={cn(
				"relative flex items-center",
				"fade-in slide-in-from-right-2 w-[200px] animate-in duration-200",
				className,
			)}
		>
			<SearchIcon className="absolute left-2.5 size-4 text-muted-foreground" />
			<Input
				ref={inputRef}
				type="text"
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className="h-8 pr-8 pl-8"
			/>
			{localValue && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="absolute right-1 h-6 w-6 p-0"
				>
					<XIcon className="size-3.5" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}

export type { SearchInputProps };
