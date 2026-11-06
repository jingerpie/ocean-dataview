"use client";

import type { PropertyMeta, WhereRule } from "@jingerpie/dataview-core";
import { getFilterPreview } from "@jingerpie/dataview-core";
import { useSimpleFilterChip } from "@jingerpie/dataview-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { SimpleFilterEditor } from "@/components/dataview/filter/simple-filter-editor";
import { PropertyIcon } from "@/components/dataview/shared/property-icon";
import { Button } from "@/components/ui/dataview-button";

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
 * Renders a chip trigger with property icon/name/preview,
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

  const displayName = property.name ?? String(property.id);

  const preview =
    variant === "detailed"
      ? getFilterPreview({
          condition: rule.condition,
          config: property.config,
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
          {displayName}
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
