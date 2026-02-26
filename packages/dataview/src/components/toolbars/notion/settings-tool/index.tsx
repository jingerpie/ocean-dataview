"use client";

import {
  ArrowDownUpIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterIcon,
  GroupIcon,
  PaletteIcon,
  RowsIcon,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { useFilterParams, useSortParams } from "../../../../hooks";
import { useDataViewContext } from "../../../../lib/providers";
import { Button } from "../../../ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { SettingsColor } from "./settings-color";
import { SettingsFilter } from "./settings-filter";
import { SettingsGroup } from "./settings-group";
import { SettingsSort } from "./settings-sort";
import { SettingsSubGroup } from "./settings-subgroup";
import { SettingsVisibility } from "./settings-visibility";

type ActiveSection =
  | "visibility"
  | "filter"
  | "sort"
  | "group"
  | "group-property"
  | "group-showAs"
  | "subgroup"
  | "subgroup-property"
  | "subgroup-showAs"
  | "color"
  | null;

interface SettingsToolProps {
  /** Enable conditional color setting */
  enableConditionalColor?: boolean;
  /** Enable filter setting */
  enableFilter?: boolean;
  /** Enable group setting */
  enableGroup?: boolean;
  /** Enable sort setting */
  enableSort?: boolean;
  /** Enable sub-group setting (board view only) */
  enableSubGroup?: boolean;
  /** Enable property visibility setting */
  enableVisibility?: boolean;
  /** Current group property name */
  groupProperty?: string;
  /** Current sub-group property name (board view only) */
  subGroupProperty?: string;
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
  group: "Group",
  "group-property": "Group by",
  "group-showAs": "Show as",
  subgroup: "Sub-group",
  "subgroup-property": "Sub-group by",
  "subgroup-showAs": "Show as",
  color: "Color",
};

/**
 * Settings tool for the Notion toolbar.
 *
 * Each section renders its own Command component.
 */
function SettingsTool({
  enableConditionalColor = false,
  enableFilter = true,
  enableGroup = true,
  enableSort = true,
  enableSubGroup = false,
  enableVisibility = true,
  groupProperty,
  subGroupProperty,
  variant = "default",
}: SettingsToolProps) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const { propertyMetas, propertyVisibility } = useDataViewContext();
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

          {enableSubGroup && (
            <CommandItem
              onSelect={() => setActiveSection("subgroup")}
              value="subgroup"
            >
              <RowsIcon />
              <span className="flex-1">Sub-group</span>
              {subGroupProperty && (
                <span className="text-muted-foreground">
                  {subGroupProperty}
                </span>
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

  // Handle subgroup sub-section changes
  const handleSubGroupSubSectionChange = (
    subSection: "property" | "showAs" | null
  ) => {
    if (subSection === "property") {
      setActiveSection("subgroup-property");
    } else if (subSection === "showAs") {
      setActiveSection("subgroup-showAs");
    } else {
      setActiveSection("subgroup");
    }
  };

  // Get the back navigation target
  const getBackTarget = (): ActiveSection => {
    if (
      activeSection === "group-property" ||
      activeSection === "group-showAs"
    ) {
      return "group";
    }
    if (
      activeSection === "subgroup-property" ||
      activeSection === "subgroup-showAs"
    ) {
      return "subgroup";
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

  // Get the current subgroup sub-section for SettingsSubGroup
  const getSubGroupSubSection = (): "property" | "showAs" | null => {
    if (activeSection === "subgroup-property") {
      return "property";
    }
    if (activeSection === "subgroup-showAs") {
      return "showAs";
    }
    return null;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "visibility":
        return <SettingsVisibility />;
      case "filter":
        return <SettingsFilter properties={propertyMetas} />;
      case "sort":
        return <SettingsSort properties={propertyMetas} />;
      case "group":
      case "group-property":
      case "group-showAs":
        return (
          <SettingsGroup
            onSubSectionChange={handleGroupSubSectionChange}
            properties={propertyMetas}
            subSection={getGroupSubSection()}
          />
        );
      case "subgroup":
      case "subgroup-property":
      case "subgroup-showAs":
        return (
          <SettingsSubGroup
            onSubSectionChange={handleSubGroupSubSectionChange}
            properties={propertyMetas}
            subSection={getSubGroupSubSection()}
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
