"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	CompoundFilter,
	Filter,
	FilterCondition,
} from "@ocean-dataview/shared/types";
import { isFilterCondition } from "@ocean-dataview/shared/types";
import {
	addCondition,
	addGroup,
	changeLogic,
	duplicateItem,
	getFilterItems,
	getFilterLogic,
	removeItem,
	updateCondition,
	wrapInGroup,
} from "@ocean-dataview/shared/utils";
import { AddFilterButton } from "./add-filter-button";
import { FilterRule } from "./filter-builder-rule";
import { GroupActionsMenu } from "./group-actions-menu";
import { GroupConnector } from "./group-connector";

interface FilterGroupProps<T> {
	/** The compound filter (AND/OR group) */
	filter: CompoundFilter;
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Current nesting level (0 = root, 1, 2) */
	level: 0 | 1 | 2;
	/** Whether this is the first item in parent (for connector display) */
	isFirst: boolean;
	/** Whether this is the second item in parent (for dropdown display) */
	isSecond?: boolean;
	/** Callback when filter changes */
	onChange: (filter: CompoundFilter) => void;
	/** Callback to remove this group (not available at root) */
	onRemove?: () => void;
	/** Callback to duplicate this group (for nested groups) */
	onDuplicate?: () => void;
	/** Callback to unwrap this group - replace with its single item (for nested groups) */
	onUnwrap?: (item: Filter) => void;
	/** Callback to wrap this group in another group (for nested groups) */
	onWrapInGroup?: () => void;
	/** Callback when this group's connector logic changes (for parent) */
	onConnectorLogicChange?: (logic: "and" | "or") => void;
	/** The connector logic from parent (how this group connects to siblings) */
	connectorLogic?: "and" | "or";
	/** Additional class names */
	className?: string;
}

/**
 * Recursive filter group component.
 * Renders filter conditions and nested groups with AND/OR logic.
 */
export function FilterGroup<T>({
	filter,
	properties,
	level,
	isFirst,
	isSecond = false,
	onChange,
	onRemove,
	onDuplicate,
	onUnwrap,
	onWrapInGroup,
	onConnectorLogicChange,
	connectorLogic = "and",
	className,
}: FilterGroupProps<T>) {
	const logic = getFilterLogic(filter);
	const items = getFilterItems(filter);

	// Can add nested groups if not at max depth (level 2)
	const canAddGroup = level < 2;

	// Handle unwrap - only works when group has exactly 1 item
	const handleUnwrap = () => {
		const firstItem = items[0];
		if (items.length === 1 && firstItem && onUnwrap) {
			onUnwrap(firstItem);
		}
	};

	// Handle adding a new condition
	const handleAddRule = (condition: FilterCondition) => {
		onChange(addCondition(filter, [], condition));
	};

	// Handle adding a new group
	const handleAddGroup = () => {
		// Find first property to use as default
		const defaultProperty = properties[0]?.id ? String(properties[0].id) : "";
		onChange(addGroup(filter, [], "and", defaultProperty));
	};

	// Handle updating a condition at index
	const handleUpdateCondition = (index: number, condition: FilterCondition) => {
		onChange(updateCondition(filter, [index], condition));
	};

	// Handle removing an item at index
	// Preserves empty group structure (doesn't auto-remove when empty)
	const handleRemoveItem = (index: number) => {
		const result = removeItem(filter, [index]);
		onChange(result);
	};

	// Handle duplicating an item at index
	const handleDuplicateItem = (index: number) => {
		onChange(duplicateItem(filter, [index]));
	};

	// Handle wrapping an item in a group at index
	const handleWrapInGroup = (index: number) => {
		onChange(wrapInGroup(filter, [index], "and"));
	};

	// Handle changing the group's logic
	const handleLogicChange = (newLogic: "and" | "or") => {
		onChange(changeLogic(filter, [], newLogic));
	};

	// Handle nested group changes
	const handleNestedGroupChange = (index: number, newGroup: CompoundFilter) => {
		// Update the nested group at this index
		const newItems = [...items];
		newItems[index] = newGroup;
		onChange(logic === "and" ? { and: newItems } : { or: newItems });
	};

	// Container styles based on level
	const containerStyles = cn(
		"flex-1",
		level === 1 && "rounded-lg border border-border/50 bg-muted/30 p-3",
		level === 2 && "rounded-md border border-border/40 bg-muted/20 p-2"
	);

	// Is this a nested group?
	const isNestedGroup = level > 0;

	// Wrapper for nested groups (includes connector + container + actions button)
	if (isNestedGroup) {
		return (
			<div className={cn("flex items-start gap-1.5", className)}>
				{/* Group connector */}
				<GroupConnector
					isFirst={isFirst}
					isSecond={isSecond}
					logic={connectorLogic}
					onLogicChange={onConnectorLogicChange ?? (() => undefined)}
				/>

				{/* Group container */}
				<div className={containerStyles}>
					{/* Render items */}
					<div className="space-y-1">
						{items.map((item, index) => {
							if (isFilterCondition(item)) {
								return (
									<FilterRule
										canWrapInGroup={level < 2}
										condition={item}
										isFirst={index === 0}
										isSecond={index === 1}
										key={index}
										level={level}
										logic={logic}
										onConditionChange={(condition) =>
											handleUpdateCondition(index, condition)
										}
										onDuplicate={() => handleDuplicateItem(index)}
										onLogicChange={handleLogicChange}
										onRemove={() => handleRemoveItem(index)}
										onWrapInGroup={() => handleWrapInGroup(index)}
										properties={properties}
									/>
								);
							}

							// Nested group
							const nextLevel = Math.min(level + 1, 2) as 0 | 1 | 2;
							return (
								<FilterGroup
									connectorLogic={logic}
									filter={item}
									isFirst={index === 0}
									isSecond={index === 1}
									key={index}
									level={nextLevel}
									onChange={(newGroup) =>
										handleNestedGroupChange(index, newGroup)
									}
									onConnectorLogicChange={(newLogic) => {
										handleLogicChange(newLogic);
									}}
									onDuplicate={() => handleDuplicateItem(index)}
									onRemove={() => handleRemoveItem(index)}
									onUnwrap={(unwrappedItem) => {
										const newItems = [...items];
										newItems[index] = unwrappedItem;
										onChange(
											logic === "and" ? { and: newItems } : { or: newItems }
										);
									}}
									onWrapInGroup={() => handleWrapInGroup(index)}
									properties={properties}
								/>
							);
						})}
					</div>

					{/* Add filter button */}
					<div className="mt-2">
						<AddFilterButton
							canAddGroup={canAddGroup}
							onAddGroup={handleAddGroup}
							onAddRule={handleAddRule}
							properties={properties}
						/>
					</div>
				</div>

				{/* Group actions menu (next to the group) */}
				{onRemove && (
					<GroupActionsMenu
						canWrapInGroup={level < 2}
						itemCount={items.length}
						onDuplicate={onDuplicate ?? (() => undefined)}
						onRemove={onRemove}
						onUnwrap={handleUnwrap}
						onWrapInGroup={onWrapInGroup ?? (() => undefined)}
					/>
				)}
			</div>
		);
	}

	// Root level group (no wrapper needed)
	return (
		<div className={cn(containerStyles, className)}>
			{/* Render items */}
			<div className="space-y-1">
				{items.map((item, index) => {
					if (isFilterCondition(item)) {
						return (
							<FilterRule
								canWrapInGroup={level < 2}
								condition={item}
								isFirst={index === 0}
								isSecond={index === 1}
								key={index}
								level={level}
								logic={logic}
								onConditionChange={(condition) =>
									handleUpdateCondition(index, condition)
								}
								onDuplicate={() => handleDuplicateItem(index)}
								onLogicChange={handleLogicChange}
								onRemove={() => handleRemoveItem(index)}
								onWrapInGroup={() => handleWrapInGroup(index)}
								properties={properties}
							/>
						);
					}

					// Nested group
					const nextLevel = Math.min(level + 1, 2) as 0 | 1 | 2;
					return (
						<FilterGroup
							connectorLogic={logic}
							filter={item}
							isFirst={index === 0}
							isSecond={index === 1}
							key={index}
							level={nextLevel}
							onChange={(newGroup) => handleNestedGroupChange(index, newGroup)}
							onConnectorLogicChange={(newLogic) => {
								// This changes how THIS group connects to siblings
								// which means changing the parent's logic
								handleLogicChange(newLogic);
							}}
							onDuplicate={() => handleDuplicateItem(index)}
							onRemove={() => handleRemoveItem(index)}
							onUnwrap={(unwrappedItem) => {
								// Replace the group with its single item
								const newItems = [...items];
								newItems[index] = unwrappedItem;
								onChange(
									logic === "and" ? { and: newItems } : { or: newItems }
								);
							}}
							onWrapInGroup={() => handleWrapInGroup(index)}
							properties={properties}
						/>
					);
				})}
			</div>

			{/* Add filter button */}
			<AddFilterButton
				canAddGroup={canAddGroup}
				className="w-full justify-start"
				onAddGroup={handleAddGroup}
				onAddRule={handleAddRule}
				properties={properties}
			/>
		</div>
	);
}

export type { FilterGroupProps };
