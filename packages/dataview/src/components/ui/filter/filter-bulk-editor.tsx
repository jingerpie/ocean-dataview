"use client";

import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useFilterParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { isWhereRule, type WhereRule } from "../../../../types";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { PropertyIcon } from "../../property-icon";
import { SimpleFilterEditor } from "./simple-filter-editor";
import { SimpleFilterPicker } from "./simple-filter-picker";

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
                      value={String(property.label ?? property.id)}
                    />
                  }
                >
                  <PropertyIcon type={property.type} />
                  <span className="flex-1 truncate">
                    {property.label ?? String(property.id)}
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
