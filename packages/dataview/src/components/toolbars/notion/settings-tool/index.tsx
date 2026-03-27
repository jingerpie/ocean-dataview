"use client";

import {
  ArrowDownUpIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ColumnsIcon,
  EyeIcon,
  FilterIcon,
  GroupIcon,
  PaletteIcon,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { useFilterParams } from "../../../../hooks/use-filter-params";
import { useSortParams } from "../../../../hooks/use-sort-params";
import { useToolbarContext } from "../../../../lib/providers/toolbar-context";
import { Button } from "../../../ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { SettingsColor } from "./settings-color";
import { SettingsColumn } from "./settings-column";
import { SettingsFilter } from "./settings-filter";
import { SettingsGroup } from "./settings-group";
import { SettingsSort } from "./settings-sort";
import { SettingsVisibility } from "./settings-visibility";

type ActiveSection =
  | "visibility"
  | "filter"
  | "sort"
  | "column"
  | "column-property"
  | "column-showAs"
  | "group"
  | "group-property"
  | "group-showAs"
  | "color"
  | null;

interface SettingsToolProps {
  /** Current column property name (board view only) */
  columnProperty?: string;
  /** Enable column setting (board view only) */
  enableColumn?: boolean;
  /** Enable conditional color setting */
  enableConditionalColor?: boolean;
  /** Enable filter setting */
  enableFilter?: boolean;
  /** Enable group setting */
  enableGroup?: boolean;
  /** Enable sort setting */
  enableSort?: boolean;
  /** Enable property visibility setting */
  enableVisibility?: boolean;
  /** Current group property name */
  groupProperty?: string;
  /**
   * Trigger variant:
   * - `default` - Settings icon with "Settings" label
   * - `icon` - Settings icon only, ghost button
   */
  variant?: "default" | "icon";
}

const sectionTitles: Record<Exclude<ActiveSection, null>, string> = {
  visibility: "Property visibility",
  filter: "Filter",
  sort: "Sort",
  column: "Column",
  "column-property": "Column by",
  "column-showAs": "Show as",
  group: "Group",
  "group-property": "Group by",
  "group-showAs": "Show as",
  color: "Color",
};

/**
 * Settings tool for the Notion toolbar.
 *
 * Reads properties and visibility from ToolbarContext.
 * Each section renders its own Command component.
 */
function SettingsTool({
  columnProperty,
  enableColumn = false,
  enableConditionalColor = false,
  enableFilter = true,
  enableGroup = true,
  enableSort = true,
  enableVisibility = true,
  groupProperty,
  variant = "default",
}: SettingsToolProps) {
  const { properties, propertyVisibility } = useToolbarContext();

  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const { filter } = useFilterParams();
  const { sort: sorts } = useSortParams();

  const visibleCount = propertyVisibility.length;
  const filterCount = filter?.length ?? 0;
  const sortCount = sorts.length;

  // Reset to main menu when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setActiveSection(null);
    }
    setOpen(isOpen);
  };

  const renderTrigger = () => {
    if (variant === "icon") {
      return (
        <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
          <Settings2 />
        </PopoverTrigger>
      );
    }

    return (
      <PopoverTrigger render={<Button variant="outline" />}>
        <Settings2 />
        <span>Settings</span>
      </PopoverTrigger>
    );
  };

  const renderMainMenu = () => (
    <Command className="p-0">
      <CommandList>
        <CommandGroup heading="View settings">
          {enableVisibility && (
            <CommandItem
              onSelect={() => setActiveSection("visibility")}
              value="visibility"
            >
              <EyeIcon />
              <span className="flex-1">Property visibility</span>
              {visibleCount > 0 && (
                <span className="text-muted-foreground">{visibleCount}</span>
              )}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {enableFilter && (
            <CommandItem
              onSelect={() => setActiveSection("filter")}
              value="filter"
            >
              <FilterIcon />
              <span className="flex-1">Filter</span>
              {filterCount > 0 && (
                <span className="text-muted-foreground">{filterCount}</span>
              )}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {enableSort && (
            <CommandItem onSelect={() => setActiveSection("sort")} value="sort">
              <ArrowDownUpIcon />
              <span className="flex-1">Sort</span>
              {sortCount > 0 && (
                <span className="text-muted-foreground">{sortCount}</span>
              )}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {enableColumn && (
            <CommandItem
              onSelect={() => setActiveSection("column")}
              value="column"
            >
              <ColumnsIcon />
              <span className="flex-1">Column</span>
              {columnProperty && (
                <span className="text-muted-foreground">{columnProperty}</span>
              )}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {enableGroup && (
            <CommandItem
              onSelect={() => setActiveSection("group")}
              value="group"
            >
              <GroupIcon />
              <span className="flex-1">Group</span>
              {groupProperty && (
                <span className="text-muted-foreground">{groupProperty}</span>
              )}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {enableConditionalColor && (
            <CommandItem
              onSelect={() => setActiveSection("color")}
              value="conditional-color"
            >
              <PaletteIcon />
              <span className="flex-1">Color</span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Handle column sub-section changes
  const handleColumnSubSectionChange = (
    subSection: "property" | "showAs" | null
  ) => {
    if (subSection === "property") {
      setActiveSection("column-property");
    } else if (subSection === "showAs") {
      setActiveSection("column-showAs");
    } else {
      setActiveSection("column");
    }
  };

  // Handle group sub-section changes
  const handleGroupSubSectionChange = (
    subSection: "property" | "showAs" | null
  ) => {
    if (subSection === "property") {
      setActiveSection("group-property");
    } else if (subSection === "showAs") {
      setActiveSection("group-showAs");
    } else {
      setActiveSection("group");
    }
  };

  // Get the back navigation target
  const getBackTarget = (): ActiveSection => {
    if (
      activeSection === "column-property" ||
      activeSection === "column-showAs"
    ) {
      return "column";
    }
    if (
      activeSection === "group-property" ||
      activeSection === "group-showAs"
    ) {
      return "group";
    }
    return null;
  };

  // Get the current column sub-section for SettingsColumn
  const getColumnSubSection = (): "property" | "showAs" | null => {
    if (activeSection === "column-property") {
      return "property";
    }
    if (activeSection === "column-showAs") {
      return "showAs";
    }
    return null;
  };

  // Get the current group sub-section for SettingsGroup
  const getGroupSubSection = (): "property" | "showAs" | null => {
    if (activeSection === "group-property") {
      return "property";
    }
    if (activeSection === "group-showAs") {
      return "showAs";
    }
    return null;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "visibility":
        return <SettingsVisibility />;
      case "filter":
        return <SettingsFilter properties={properties} />;
      case "sort":
        return <SettingsSort properties={properties} />;
      case "column":
      case "column-property":
      case "column-showAs":
        return (
          <SettingsColumn
            onSubSectionChange={handleColumnSubSectionChange}
            properties={properties}
            subSection={getColumnSubSection()}
          />
        );
      case "group":
      case "group-property":
      case "group-showAs":
        return (
          <SettingsGroup
            onSubSectionChange={handleGroupSubSectionChange}
            properties={properties}
            subSection={getGroupSubSection()}
          />
        );
      case "color":
        return <SettingsColor />;
      default:
        return null;
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      {renderTrigger()}
      <PopoverContent align="end" className="w-auto min-w-64 gap-0 p-0">
        {/* Back button - only shown in sub-sections */}
        {activeSection && (
          <div className="flex items-center gap-2 px-2 pt-2">
            <Button
              onClick={() => setActiveSection(getBackTarget())}
              size="icon-xs"
              variant="ghost"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <span className="font-medium text-sm">
              {sectionTitles[activeSection]}
            </span>
          </div>
        )}

        {/* Content */}
        {activeSection ? renderSectionContent() : renderMainMenu()}
      </PopoverContent>
    </Popover>
  );
}

export { SettingsTool, type SettingsToolProps };
