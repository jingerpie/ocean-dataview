"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { ChevronDownIcon } from "lucide-react";
import { useSimpleFilterChip } from "../../../hooks";
import { getFilterPreview } from "../../../lib/filter-preview";
import type { PropertyMeta } from "../../../types";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { PropertyIcon } from "../../ui/property-icon";
import { SimpleFilterEditor } from "../../ui/toolbar/filter/simple-filter-editor";

interface SimpleFilterChipProps {
  /** Callback when rule changes */
  onRuleChange: (rule: WhereRule) => void;
  /** The property being filtered */
  property: PropertyMeta;
  /** The filter rule */
  rule: WhereRule;
  /**
   * Chip variant:
   * - `compact` - Shows property name only: [Icon] Property ▾
   * - `detailed` - Shows property + preview: [Icon] Property: Preview ▾
   * @default "compact"
   */
  variant?: "compact" | "detailed";
}

/**
 * Simple filter chip for the chips bar.
 *
 * Renders a chip trigger with property icon/label/preview,
 * opening a popover with SimpleFilterEditor.
 */
function SimpleFilterChip({
  rule,
  property,
  onRuleChange,
  variant = "compact",
}: SimpleFilterChipProps) {
  const { openPropertyId, setOpen } = useSimpleFilterChip();
  const isOpen = openPropertyId === rule.property;

  const handleOpenChange = (open: boolean) => {
    setOpen(open ? rule.property : null);
  };

  const close = () => setOpen(null);

  const label = property.label ?? String(property.id);

  const preview =
    variant === "detailed"
      ? getFilterPreview({
          condition: rule.condition,
          propertyType: property.type,
          value: rule.value,
        })
      : "";

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
      <PopoverContent align="start" className="w-64 gap-0 p-1">
        <SimpleFilterEditor
          onClose={close}
          onRuleChange={onRuleChange}
          property={property}
          rule={rule}
        />
      </PopoverContent>
    </Popover>
  );
}

export { SimpleFilterChip, type SimpleFilterChipProps };
