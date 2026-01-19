"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { WhereCondition } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	getDefaultFilterOperator,
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import { ChevronDownIcon, CopyPlusIcon, PlusIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface AddFilterButtonProps<T> {
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Whether adding a group is allowed (false at max depth) */
	canAddGroup: boolean;
	/** Callback when a new rule is added */
	onAddRule: (condition: WhereCondition) => void;
	/** Callback when a new group is added */
	onAddGroup: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Button to add a new filter rule or group.
 *
 * - "Add filter rule" immediately creates a rule with the first property
 * - "Add filter group" creates a nested AND group
 * - User can change property afterward using PropertySelect in FilterRule
 */
export function AddFilterButton<T>({
	properties,
	canAddGroup,
	onAddRule,
	onAddGroup,
	className,
}: AddFilterButtonProps<T>) {
	// Create condition with first property as default
	const handleAddRule = () => {
		const firstProperty = properties[0];
		if (!firstProperty) {
			return;
		}

		const filterVariant = getFilterVariantFromPropertyType(firstProperty.type);
		const defaultOperator = getDefaultFilterOperator(filterVariant);
		const condition = createDefaultCondition(
			String(firstProperty.id),
			defaultOperator
		);

		onAddRule(condition);
	};

	// When can add group, show dropdown with two options
	if (canAddGroup) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							className={cn(className, "text-muted-foreground!")}
							size="sm"
							variant="ghost"
						>
							<PlusIcon />
							<span>Add filter rule</span>
							<ChevronDownIcon />
						</Button>
					}
				/>
				<DropdownMenuContent align="start" className="w-auto">
					<DropdownMenuItem onClick={handleAddRule}>
						<PlusIcon className="size-4" />
						<span>Add filter rule</span>
					</DropdownMenuItem>

					<DropdownMenuItem onClick={onAddGroup}>
						<CopyPlusIcon className="size-4" />
						<div className="flex flex-col">
							<span>Add filter group</span>
							<span className="text-muted-foreground text-xs">
								A group to nest more filters
							</span>
						</div>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	// At max depth, just a simple button (no dropdown needed)
	return (
		<Button
			className={cn(className, "text-muted-foreground!")}
			onClick={handleAddRule}
			size="sm"
			variant="ghost"
		>
			<PlusIcon />
			<span>Add filter rule</span>
		</Button>
	);
}

export type { AddFilterButtonProps };
