"use client";

import { CheckIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useGroupParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../command";
import { PropertyIcon } from "../../property-icon";

interface GroupPickerProps {
  /** Additional callback after setting the group */
  onSetGroup?: (property: PropertyMeta | null) => void;
  /** Available properties to group by */
  properties: readonly PropertyMeta[];
}

/**
 * Property picker for selecting which property to group by.
 *
 * Handles group selection internally via useGroupParams().
 *
 * Features:
 * - Searchable Command-based list
 * - "None" option to clear grouping
 * - Only shows groupable property types
 * - Shows checkmark for currently selected property
 * - Sorted alphabetically by label
 */
function GroupPicker({ properties, onSetGroup }: GroupPickerProps) {
  const { groupProperty, setGroup, clearGroup } = useGroupParams();

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
    clearGroup();
    onSetGroup?.(null);
  }, [clearGroup, onSetGroup]);

  const handleSelect = useCallback(
    (property: PropertyMeta) => {
      // Build the group config based on property type
      switch (property.type) {
        case "select":
          setGroup({ bySelect: { property: property.id } });
          break;
        case "multiSelect":
          setGroup({ byMultiSelect: { property: property.id } });
          break;
        case "status":
          setGroup({ byStatus: { property: property.id, showAs: "option" } });
          break;
        case "checkbox":
          setGroup({ byCheckbox: { property: property.id } });
          break;
        case "date":
          setGroup({ byDate: { property: property.id, showAs: "day" } });
          break;
        case "number":
          setGroup({ byNumber: { property: property.id } });
          break;
        case "text":
        case "url":
        case "email":
        case "phone":
          setGroup({ byText: { property: property.id, showAs: "exact" } });
          break;
        default:
          return;
      }
      onSetGroup?.(property);
    },
    [setGroup, onSetGroup]
  );

  return (
    <Command className="p-0">
      <CommandInput placeholder="Search for a property..." />
      <CommandEmpty>No groupable properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {/* None option to clear grouping */}
          <CommandItem onSelect={handleSelectNone} value="none">
            <span className="text-muted-foreground">None</span>
            {!groupProperty && <CheckIcon className="ml-auto size-4" />}
          </CommandItem>
          {groupableProperties.map((property) => {
            const isSelected = property.id === groupProperty;
            return (
              <CommandItem
                key={String(property.id)}
                onSelect={() => handleSelect(property)}
                value={String(property.label ?? property.id)}
              >
                <PropertyIcon type={property.type} />
                <span className="flex-1 truncate">
                  {property.label ?? String(property.id)}
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
