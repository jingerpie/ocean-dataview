"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxSeparator,
	ComboboxTrigger,
	ComboboxValue,
} from "@ocean-dataview/dataview/components/ui/combobox";
import { PropertyIcon } from "@ocean-dataview/dataview/components/ui/property-icon";
import {
	useAdvanceFilterBuilder,
	useFilterParams,
	useSimpleFilterChip,
} from "@ocean-dataview/dataview/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { isWhereExpression, isWhereRule } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	getDefaultFilterCondition,
	getFilterVariantFromPropertyType,
	normalizeFilter,
} from "@ocean-dataview/shared/utils";
import { ListFilterIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

interface FilterPropertyPickerProps<T> {
	/** Available properties to filter by */
	properties: DataViewProperty<T>[];
	/**
	 * Override default click behavior. If provided, replaces default action (open dropdown).
	 * Use this to customize what happens when the trigger is clicked.
	 */
	onClick?: () => void;
	/**
	 * Trigger variant:
	 * - `default` - Filter icon with "Filter" label, outline button
	 * - `icon` - Filter icon only, ghost button
	 * - `rule` - Shows selected property value (for changing property in existing rule)
	 */
	variant?: "default" | "icon" | "rule";
	/**
	 * Advanced mode (for use inside advanced filter builder):
	 * - `true` - No "Add advanced filter" button, shows all properties
	 * - `false` - Shows "Add advanced filter" button, excludes already-used properties
	 */
	advance?: boolean;
	/** Currently selected property (for rule variant only) */
	value?: DataViewProperty<T>;
	/** Callback when property changes (for rule variant only) */
	onPropertyChange?: (property: DataViewProperty<T>) => void;
}

/**
 * Filter property picker with Combobox.
 *
 * Uses `useFilterParams()` and `useAdvanceFilterBuilder()` internally.
 *
 * Trigger Variants:
 * - `default` - Filter icon with "Filter" label, outline button
 * - `icon` - Filter icon only, ghost button
 * - `rule` - Shows selected property value (for existing filter rules)
 *
 * Content Modes:
 * - `advance=false` (default) - Shows "Add advanced filter" button, excludes already-used properties
 * - `advance=true` - No "Add advanced filter" button, shows all properties
 *
 * Click Behavior:
 * - If `onClick` is NOT provided → default behavior (open dropdown)
 * - If `onClick` IS provided → overrides default, calls provided function instead
 */
function FilterPropertyPicker<T>({
	properties,
	onClick,
	variant = "default",
	advance = false,
	value,
	onPropertyChange,
}: FilterPropertyPickerProps<T>) {
	const [open, setOpen] = useState(false);
	const { filter, setFilter } = useFilterParams();
	const openAdvancedFilterBuilder = useAdvanceFilterBuilder(
		(state) => state.open
	);
	const openFilterChip = useSimpleFilterChip((state) => state.open);

	// Check if advanced filter already exists (nested WhereExpression at root)
	const hasAdvancedFilter = useMemo(() => {
		if (!filter) {
			return false;
		}
		const normalized = normalizeFilter(filter);
		return (normalized?.and ?? []).some(isWhereExpression);
	}, [filter]);

	// Compute property IDs already used in filter (for non-advance mode)
	const usedPropertyIds = useMemo(() => {
		if (advance || !filter) {
			return [];
		}
		const normalized = normalizeFilter(filter);
		return (normalized?.and ?? [])
			.filter(isWhereRule)
			.map((rule) => rule.property);
	}, [advance, filter]);

	// Filter out already-used properties (only when not in advance mode)
	const availableProperties = useMemo(() => {
		if (advance) {
			return properties;
		}
		return properties.filter((p) => !usedPropertyIds.includes(String(p.id)));
	}, [advance, properties, usedPropertyIds]);

	// Find matching property from items for rule variant
	const selectedProperty = value
		? properties.find((p) => p.id === value.id)
		: undefined;

	// Handle property selection
	const handleSelect = (property: DataViewProperty<T>) => {
		// For rule variant, just notify parent
		if (variant === "rule") {
			onPropertyChange?.(property);
			setOpen(false);
			return;
		}

		// Get the correct default condition based on property type
		const filterVariant = getFilterVariantFromPropertyType(property.type);
		const defaultCondition = getDefaultFilterCondition(filterVariant);
		const rule = createDefaultCondition(String(property.id), defaultCondition);

		// Add to existing filter or create new
		const normalized = normalizeFilter(filter);
		if (normalized) {
			const items = normalized.and ?? [];
			setFilter({ and: [...items, rule] });
		} else {
			setFilter({ and: [rule] });
		}

		setOpen(false);

		// Auto-open the filter chip for the newly added filter
		openFilterChip(String(property.id));
	};

	// Handle open advanced filter
	const handleAdvancedFilter = () => {
		setOpen(false);

		// Create advanced filter structure if it doesn't exist
		const firstProperty = properties[0];
		if (firstProperty && !hasAdvancedFilter) {
			const defaultCondition = createDefaultCondition(String(firstProperty.id));
			const normalized = normalizeFilter(filter);

			if (normalized) {
				// Has existing simple filters, add advanced filter alongside
				setFilter({
					and: [...(normalized.and ?? []), { and: [defaultCondition] }],
				});
			} else {
				// No filter exists, create new with advanced filter structure
				setFilter({ and: [{ and: [defaultCondition] }] });
			}
		}

		openAdvancedFilterBuilder();
	};

	// Render trigger based on variant
	const renderTrigger = () => {
		if (variant === "rule") {
			return (
				<ComboboxTrigger render={<Button size="sm" variant="outline" />}>
					<ComboboxValue>
						{selectedProperty ? (
							<>
								<PropertyIcon type={selectedProperty.type} />
								<span>
									{selectedProperty.label ?? String(selectedProperty.id)}
								</span>
							</>
						) : (
							"Select property..."
						)}
					</ComboboxValue>
				</ComboboxTrigger>
			);
		}

		if (variant === "icon") {
			return (
				<ComboboxTrigger
					render={<Button size="icon-sm" variant="ghost" />}
					showChevron={false}
				>
					<ListFilterIcon />
				</ComboboxTrigger>
			);
		}

		// default variant
		return (
			<ComboboxTrigger render={<Button size="sm" variant="outline" />}>
				<ListFilterIcon />
				<span>Filter</span>
			</ComboboxTrigger>
		);
	};

	// Compute value - use null instead of undefined to keep component in controlled mode
	// Type assertion needed because base-ui Combobox has complex generic inference with union types
	const comboboxValue = (
		variant === "rule" ? (selectedProperty ?? null) : null
	) as never;

	// When onClick is provided for non-rule variants, render standalone button
	// This completely bypasses Combobox behavior - clicking only calls onClick
	if (onClick && variant !== "rule") {
		if (variant === "icon") {
			return (
				<Button onClick={onClick} size="icon-sm" variant="ghost">
					<ListFilterIcon />
				</Button>
			);
		}
		// default variant
		return (
			<Button onClick={onClick} size="sm" variant="outline">
				<ListFilterIcon />
				<span>Filter</span>
			</Button>
		);
	}

	return (
		<Combobox
			items={availableProperties}
			onOpenChange={setOpen}
			onValueChange={(newValue) => {
				if (newValue) {
					handleSelect(newValue as DataViewProperty<T>);
				}
			}}
			open={open}
			value={comboboxValue}
		>
			{renderTrigger()}
			<ComboboxContent align="start" className="flex w-56 flex-col">
				<ComboboxInput placeholder="Filter by..." showTrigger={false} />
				<ComboboxEmpty>No properties found.</ComboboxEmpty>
				<ComboboxList>
					{(property) => (
						<ComboboxItem key={String(property.id)} value={property}>
							<PropertyIcon type={property.type} />
							<span className="truncate">
								{property.label ?? String(property.id)}
							</span>
						</ComboboxItem>
					)}
				</ComboboxList>
				{!advance && (
					<>
						<ComboboxSeparator className="my-0" />
						<Button
							className="my-1 w-full justify-start"
							onClick={handleAdvancedFilter}
							size="sm"
							variant="ghost"
						>
							<PlusIcon />
							<span>Add advanced filter</span>
						</Button>
					</>
				)}
			</ComboboxContent>
		</Combobox>
	);
}

export { FilterPropertyPicker, type FilterPropertyPickerProps };
