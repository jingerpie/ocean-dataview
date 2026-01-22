"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { useDebouncer } from "@tanstack/react-pacer";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const SEARCH_DEBOUNCE_MS = 150;

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

/**
 * Debounced search input component (150ms debounce)
 * Waits for user to stop typing before triggering onChange
 */
export function SearchBar({
	value,
	onChange,
	placeholder = "Search...",
}: SearchBarProps) {
	const [localValue, setLocalValue] = useState(value);

	// Debounced onChange using TanStack Pacer
	const changeDebouncer = useDebouncer(onChange, {
		wait: SEARCH_DEBOUNCE_MS,
	});

	// Sync local value when external value changes (e.g., back/forward navigation)
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Trigger debounced onChange when local value changes
	useEffect(() => {
		if (localValue !== value) {
			changeDebouncer.maybeExecute(localValue);
		}
	}, [localValue, changeDebouncer, value]);

	// Flush pending updates on unmount
	useEffect(() => {
		return () => changeDebouncer.flush();
	}, [changeDebouncer]);

	const handleClear = () => {
		setLocalValue("");
		changeDebouncer.cancel();
		onChange("");
	};

	return (
		<div className="relative flex items-center">
			<Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
			<Input
				className="pr-9 pl-9"
				onChange={(e) => setLocalValue(e.target.value)}
				placeholder={placeholder}
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
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}
