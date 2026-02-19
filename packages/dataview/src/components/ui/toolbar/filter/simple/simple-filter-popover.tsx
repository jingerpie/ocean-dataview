"use client";

import type { FilterCondition, WhereRule } from "@sparkyidea/shared/types";
import { applyConditionChange } from "@sparkyidea/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useSimpleFilterChip } from "../../../../../hooks";
import { getFilterPreview } from "../../../../../lib/filter-preview";
import { cn } from "../../../../../lib/utils";
import type { PropertyMeta } from "../../../../../types";
import { Button } from "../../../button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
import { PropertyIcon } from "../../../property-icon";
import { ConditionPicker } from "../pickers/condition-picker";
import { FilterActions } from "./filter-actions";

interface SimpleFilterPopoverProps {
  children?: ReactNode;
  classNames?: string;
  onAddToAdvanced?: () => void;
  onRemove: () => void;
  onRuleChange: (rule: WhereRule) => void;
  property: PropertyMeta;
  rule: WhereRule;
  variant?: "compact" | "detailed";
}

function SimpleFilterPopover({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant = "compact",
  children,
  classNames,
}: SimpleFilterPopoverProps) {
  const { openPropertyId, setOpen } = useSimpleFilterChip();
  const isOpen = openPropertyId === rule.property;

  const handleOpenChange = (open: boolean) => {
    setOpen(open ? rule.property : null);
  };

  const label = property.label ?? String(property.id);

  const preview =
    variant === "detailed"
      ? getFilterPreview({
          condition: rule.condition,
          value: rule.value,
          propertyType: property.type,
        })
      : "";

  const handleConditionChange = (newCondition: FilterCondition) => {
    onRuleChange(applyConditionChange(rule, newCondition, property.type));
  };

  const close = () => setOpen(null);

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger
        className={variant === "detailed" ? "max-w-58" : undefined}
        render={
          <Button className="border-dashed" size="sm" variant="outline" />
        }
      >
        <PropertyIcon type={property.type} />
        <span className="truncate">
          {label}
          {variant === "detailed" && preview}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-64 gap-0 p-1", classNames)}
      >
        {/* Header: Property + Condition + Menu */}
        <div className="flex items-center justify-between px-1">
          <div className="flex min-w-0 items-center pl-1">
            <span className="max-w-24 truncate font-medium text-muted-foreground text-xs">
              {label}
            </span>
            <ConditionPicker
              className="p-1 font-semibold text-xs"
              condition={rule.condition}
              inline
              onConditionChange={handleConditionChange}
              propertyType={property.type}
            />
          </div>
          <FilterActions
            onAddToAdvanced={
              onAddToAdvanced
                ? () => {
                    onAddToAdvanced();
                    close();
                  }
                : undefined
            }
            onRemove={() => {
              onRemove();
              close();
            }}
          />
        </div>

        {/* Body Content */}
        {rule.condition !== "isEmpty" &&
          rule.condition !== "isNotEmpty" &&
          children}
      </PopoverContent>
    </Popover>
  );
}

export { SimpleFilterPopover };
export type { SimpleFilterPopoverProps };
