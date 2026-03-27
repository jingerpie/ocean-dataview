"use client";

import { CheckIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  type GroupingMode,
  useGroupingParams,
} from "../../../hooks/use-grouping-params";
import type { PropertyMeta } from "../../../types/property.type";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { PropertyIcon } from "../property-icon";

interface GroupPickerProps {
  /** Mode: "group" or "column" (default: "group") */
  mode?: GroupingMode;
  /** Additional callback after setting the group */
  onSetGroup?: (property: PropertyMeta | null) => void;
  /** Available properties to group by */
  properties: readonly PropertyMeta[];
}

/**
 * Property picker for selecting which property to group by.
 *
 * Handles group selection internally via useGroupingParams().
 * Can be used for both group and column via the `mode` prop.
 *
 * Features:
 * - Searchable Command-based list
 * - "None" option to clear grouping
 * - Only shows groupable property types
 * - Shows checkmark for currently selected property
 * - Sorted alphabetically by label
 */
function GroupPicker({
  mode = "group",
  onSetGroup,
  properties,
}: GroupPickerProps) {
  const { property, setConfig, clearConfig } = useGroupingParams(mode);

  // Filter and sort properties that can be grouped
  // Excludes formula, button, filesMedia (can't group by these)
  const groupableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" &&
        p.type !== "button" &&
        p.type !== "filesMedia" &&
        p.hidden !== true &&
        p.enableGroup !== false
    );

    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [properties]);

  const handleSelectNone = useCallback(() => {
    clearConfig();
    onSetGroup?.(null);
  }, [clearConfig, onSetGroup]);

  const handleSelect = useCallback(
    (prop: PropertyMeta) => {
      // Build the group config based on property type using canonical structure
      switch (prop.type) {
        case "select":
          setConfig({ propertyType: "select", propertyId: prop.id });
          break;
        case "multiSelect":
          setConfig({ propertyType: "multiSelect", propertyId: prop.id });
          break;
        case "status":
          setConfig({
            propertyType: "status",
            propertyId: prop.id,
            showAs: "option",
          });
          break;
        case "checkbox":
          setConfig({ propertyType: "checkbox", propertyId: prop.id });
          break;
        case "date":
          setConfig({
            propertyType: "date",
            propertyId: prop.id,
            showAs: "day",
          });
          break;
        case "number":
          setConfig({ propertyType: "number", propertyId: prop.id });
          break;
        case "text":
        case "url":
        case "email":
        case "phone":
          setConfig({
            propertyType: "text",
            propertyId: prop.id,
            showAs: "exact",
          });
          break;
        default:
          return;
      }
      onSetGroup?.(prop);
    },
    [setConfig, onSetGroup]
  );

  return (
    <Command className="p-0">
      <CommandInput placeholder="Search for a property..." />
      <CommandEmpty>No groupable properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {/* None option to clear grouping (not shown for column mode since board requires column) */}
          {mode !== "column" && (
            <CommandItem onSelect={handleSelectNone} value="none">
              <span className="text-muted-foreground">None</span>
              {!property && <CheckIcon className="ml-auto size-4" />}
            </CommandItem>
          )}
          {groupableProperties.map((prop) => {
            const isSelected = prop.id === property;
            return (
              <CommandItem
                key={String(prop.id)}
                onSelect={() => handleSelect(prop)}
                value={String(prop.label ?? prop.id)}
              >
                <PropertyIcon type={prop.type} />
                <span className="flex-1 truncate">
                  {prop.label ?? String(prop.id)}
                </span>
                {isSelected && <CheckIcon className="size-4" />}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { GroupPicker, type GroupPickerProps };
