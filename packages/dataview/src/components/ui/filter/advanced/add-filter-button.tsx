"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { WhereCondition } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	getDefaultFilterOperator,
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import { ChevronDownIcon, CopyPlusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
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
	const [open, setOpen] = useState(false);

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
		setOpen(false);
	};

	const handleAddGroup = () => {
		onAddGroup();
		setOpen(false);
	};

	// When can add group, show popover with two options
	if (canAddGroup) {
		return (
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger
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
				<PopoverContent align="start" className="w-auto gap-1 p-2">
					{/* Add Filter Rule */}
					<Button
						className="w-full justify-start"
						onClick={handleAddRule}
						size="sm"
						variant="ghost"
					>
						<PlusIcon />
						<span>Add filter rule</span>
					</Button>

					{/* Add Filter Group */}
					<Button
						className="h-auto w-full flex-col items-start"
						onClick={handleAddGroup}
						size="sm"
						variant="ghost"
					>
						<div className="flex items-center gap-2">
							<CopyPlusIcon />
							<span>Add filter group</span>
						</div>
						<span className="ml-6 text-muted-foreground text-xs">
							A group to nest more filters
						</span>
					</Button>
				</PopoverContent>
			</Popover>
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
