"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	debounceMs?: number;
}

/**
 * Debounced search input component
 * Waits for user to stop typing before triggering onChange
 */
export function SearchBar({
	value,
	onChange,
	placeholder = "Search...",
	debounceMs = 300,
}: SearchBarProps) {
	const [localValue, setLocalValue] = useState(value);

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

	const handleClear = () => {
		setLocalValue("");
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
