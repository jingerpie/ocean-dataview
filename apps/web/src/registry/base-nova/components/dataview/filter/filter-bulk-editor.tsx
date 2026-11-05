"use client";

import type { PropertyMeta } from "@jingerpie/dataview-core";
import { isWhereRule, type WhereRule } from "@jingerpie/dataview-core";
import { useFilterParams } from "@jingerpie/dataview-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sparkyidea/ui/components/popover";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { SimpleFilterEditor } from "@/registry/base-nova/components/dataview/filter/simple-filter-editor";
import { SimpleFilterPicker } from "@/registry/base-nova/components/dataview/filter/simple-filter-picker";
import { PropertyIcon } from "@/registry/base-nova/components/dataview/shared/property-icon";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/registry/base-nova/ui/dataview-command";

interface FilterBulkEditorProps {
  /** Additional callback after delete all */
  onDeleteAll?: () => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
}

/**
 * Bulk editor for managing multiple filter rules.
 *
 * Shows list of active filters with property icon/name,
 * clicking opens a local popover with SimpleFilterEditor.
 * Uses Command for consistent UI.
 */
function FilterBulkEditor({ properties, onDeleteAll }: FilterBulkEditorProps) {
  const { filter, setFilter, clearFilter } = useFilterParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(
    null
  );

  // Get simple filter rules (WhereRule at root level)
  const simpleFilters = useMemo(() => {
    if (!filter) {
      return [];
    }
    return filter
      .map((node, index) => ({ node, index }))
      .filter((item): item is { node: WhereRule; index: number } =>
        isWhereRule(item.node)
      );
  }, [filter]);

  const handleDeleteAll = () => {
    clearFilter();
    onDeleteAll?.();
  };

  const handleRuleChange = useCallback(
    (propertyId: string, updatedRule: WhereRule) => {
      if (!filter) {
        return;
      }
      const newFilter = filter.map((node) => {
        if (isWhereRule(node) && node.property === propertyId) {
          return updatedRule;
        }
        return node;
      });
      setFilter(newFilter);
    },
    [filter, setFilter]
  );

  const handleFilterAdded = (property: PropertyMeta) => {
    setPickerOpen(false);
    // Open the editor for the newly added filter
    setEditingPropertyId(String(property.id));
  };

  return (
    <Command className="p-0">
      <CommandList>
        {/* Filter list */}
        <CommandGroup>
          {simpleFilters.map(({ node: rule }) => {
            const property = properties.find(
              (p) => String(p.id) === rule.property
            );
            if (!property) {
              return null;
            }

            const isOpen = editingPropertyId === rule.property;

            return (
              <Popover
                key={rule.property}
                onOpenChange={(open) =>
                  setEditingPropertyId(open ? rule.property : null)
                }
                open={isOpen}
              >
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <CommandItem
                      onSelect={() =>
                        setEditingPropertyId(isOpen ? null : rule.property)
                      }
                      value={String(property.name ?? property.id)}
                    />
                  }
                >
                  <PropertyIcon type={property.type} />
                  <span className="flex-1 truncate">
                    {property.name ?? String(property.id)}
                  </span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 gap-0 p-1">
                  <SimpleFilterEditor
                    onClose={() => setEditingPropertyId(null)}
                    onRuleChange={(updatedRule) =>
                      handleRuleChange(rule.property, updatedRule)
                    }
                    property={property}
                    rule={rule}
                  />
                </PopoverContent>
              </Popover>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup>
          <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={
                <CommandItem
                  onSelect={() => setPickerOpen((prev) => !prev)}
                  value="add-filter"
                />
              }
            >
              <PlusIcon />
              <span>Add filter</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <SimpleFilterPicker
                onAddFilter={handleFilterAdded}
                properties={properties}
              />
            </PopoverContent>
          </Popover>
          <CommandItem className="text-destructive" onSelect={handleDeleteAll}>
            <Trash2Icon />
            <span>Delete filter</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { FilterBulkEditor, type FilterBulkEditorProps };
