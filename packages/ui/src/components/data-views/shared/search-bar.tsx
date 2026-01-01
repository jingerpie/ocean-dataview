"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import { Input } from "@ocean-dataview/ui/components/input";
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
				type="text"
				placeholder={placeholder}
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				className="pr-9 pl-9"
			/>
			{localValue && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="absolute right-1 h-7 w-7 p-0"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}
