"use client";

import { useSortBuilder } from "../../../hooks/use-sort-builder";
import { useSortParams } from "../../../hooks/use-sort-params";
import type { PropertyMeta } from "../../../types/property.type";
import { SortBulkEditor } from "../../ui/sort/sort-bulk-editor";
import { SortTrigger } from "../../ui/sort/sort-trigger";

interface SortChipProps {
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Sort chip that shows sort count and opens the sort builder.
 * Appearance: [↕ N sorts ▾]
 *
 * Composes SortTrigger + SortBulkEditor.
 */
function SortChip({ properties }: SortChipProps) {
  const { sort: sorts } = useSortParams();
  const { isOpen, setOpen } = useSortBuilder();

  return (
    <SortTrigger
      count={sorts.length}
      onOpenChange={setOpen}
      open={isOpen}
      variant="count"
    >
      <SortBulkEditor
        onDeleteAll={() => setOpen(false)}
        properties={properties}
      />
    </SortTrigger>
  );
}

export { SortChip, type SortChipProps };
