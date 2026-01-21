"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

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
	/**
	 * Trigger variant (for collapsed state):
	 * - `default` - Icon + text, outline button
	 * - `icon` - Icon only, ghost button
	 */
	variant?: "default" | "icon";
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
	variant = "default",
}: SearchInputProps) {
	const [expanded, setExpanded] = useState(false);
	const [localValue, setLocalValue] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync local value when external value changes
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Debounced onChange
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localValue !== value) {
				onChange(localValue);
			}
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [localValue, debounceMs, onChange, value]);

	// Auto-expand when value exists
	useEffect(() => {
		if (value && !expanded) {
			setExpanded(true);
		}
	}, [value, expanded]);

	// Focus input when expanded
	useEffect(() => {
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

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			if (localValue) {
				handleClear();
			} else {
				setExpanded(false);
				inputRef.current?.blur();
			}
		}
	};

	// Collapsed state - trigger button
	if (!expanded) {
		return variant === "icon" ? (
			<Button
				aria-label="Open search"
				className={className}
				onClick={handleExpand}
				size="icon-sm"
				variant="ghost"
			>
				<SearchIcon className="size-4" />
			</Button>
		) : (
			<Button
				aria-label="Open search"
				className={className}
				onClick={handleExpand}
				size="sm"
				variant="outline"
			>
				<SearchIcon className="size-4" />
				<span>Search</span>
			</Button>
		);
	}

	// Expanded state - input with icon
	return (
		<div
			className={cn(
				"relative flex items-center",
				"fade-in slide-in-from-right-2 w-50 animate-in duration-200",
				className
			)}
		>
			<SearchIcon className="absolute left-2.5 size-4 text-muted-foreground" />
			<Input
				className="h-8 pr-8 pl-8"
				onBlur={handleBlur}
				onChange={(e) => setLocalValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				ref={inputRef}
				type="text"
				value={localValue}
			/>
			{localValue && (
				<Button
					className="absolute right-1"
					onClick={handleClear}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<XIcon className="size-3.5" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}

export type { SearchInputProps };
