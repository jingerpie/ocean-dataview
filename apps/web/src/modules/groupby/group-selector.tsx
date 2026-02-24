"use client";

import {
  type GroupByConfigInput,
  parseAsGroupBy,
} from "@sparkyidea/shared/utils/parsers/group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@sparkyidea/ui/components/select";
import { useQueryState } from "nuqs";

interface GroupOption {
  config: GroupByConfigInput;
  label: string;
}

const BY_SELECT_OPTIONS: GroupOption[] = [
  {
    label: "Select",
    config: { bySelect: { property: "category" } },
  },
];

const BY_STATUS_OPTIONS: GroupOption[] = [
  {
    label: "Status (option)",
    config: { byStatus: { property: "availability", showAs: "option" } },
  },
  {
    label: "Status (group)",
    config: { byStatus: { property: "availability", showAs: "group" } },
  },
];

const BY_DATE_OPTIONS: GroupOption[] = [
  {
    label: "Date (relative)",
    config: { byDate: { property: "lastRestocked", showAs: "relative" } },
  },
  {
    label: "Date (day)",
    config: { byDate: { property: "lastRestocked", showAs: "day" } },
  },
  {
    label: "Date (week)",
    config: { byDate: { property: "lastRestocked", showAs: "week" } },
  },
  {
    label: "Date (month)",
    config: { byDate: { property: "lastRestocked", showAs: "month" } },
  },
  {
    label: "Date (year)",
    config: { byDate: { property: "lastRestocked", showAs: "year" } },
  },
];

const BY_CHECKBOX_OPTIONS: GroupOption[] = [
  {
    label: "Checkbox",
    config: { byCheckbox: { property: "featured" } },
  },
];

const BY_MULTI_SELECT_OPTIONS: GroupOption[] = [
  {
    label: "Multi Select",
    config: { byMultiSelect: { property: "tags" } },
  },
];

const BY_TEXT_OPTIONS: GroupOption[] = [
  {
    label: "Text (exact)",
    config: { byText: { property: "productName", showAs: "exact" } },
  },
  {
    label: "Text (alphabetical)",
    config: { byText: { property: "productName", showAs: "alphabetical" } },
  },
];

const BY_NUMBER_OPTIONS: GroupOption[] = [
  {
    label: "Number (0-500, step 100)",
    config: {
      byNumber: { property: "price", showAs: { range: [0, 500], step: 100 } },
    },
  },
];

const ALL_OPTIONS: GroupOption[] = [
  ...BY_SELECT_OPTIONS,
  ...BY_STATUS_OPTIONS,
  ...BY_DATE_OPTIONS,
  ...BY_CHECKBOX_OPTIONS,
  ...BY_MULTI_SELECT_OPTIONS,
  ...BY_TEXT_OPTIONS,
  ...BY_NUMBER_OPTIONS,
];

const DEFAULT_GROUP: GroupByConfigInput = {
  bySelect: { property: "category" },
};

/**
 * Get a stable key for a GroupByConfigInput (for Select value matching).
 * Uses JSON.stringify since configs are simple objects.
 */
function getConfigKey(config: GroupByConfigInput): string {
  return JSON.stringify(config);
}

/**
 * Find option by config (deep equality via JSON key).
 */
function findOptionByConfig(
  config: GroupByConfigInput
): GroupOption | undefined {
  const key = getConfigKey(config);
  return ALL_OPTIONS.find((opt) => getConfigKey(opt.config) === key);
}

export function useGroupConfig() {
  const [groupConfig, setGroupConfig] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ shallow: false })
  );

  // Use default if null
  const effectiveConfig = groupConfig ?? DEFAULT_GROUP;

  return {
    groupConfig: effectiveConfig,
    setGroupConfig,
  };
}

function renderGroup(label: string, options: GroupOption[]) {
  return (
    <SelectGroup>
      <SelectLabel>{label}</SelectLabel>
      {options.map((option) => {
        const key = getConfigKey(option.config);
        return (
          <SelectItem key={key} value={key}>
            {option.label}
          </SelectItem>
        );
      })}
    </SelectGroup>
  );
}

export function GroupSelector() {
  const { groupConfig, setGroupConfig } = useGroupConfig();

  const selectedKey = getConfigKey(groupConfig);
  const selectedLabel = findOptionByConfig(groupConfig)?.label ?? "Select...";

  const handleValueChange = (key: string | null) => {
    if (!key) {
      return;
    }
    // Find the option by its JSON key and set the config
    const option = ALL_OPTIONS.find((opt) => getConfigKey(opt.config) === key);
    if (option) {
      void setGroupConfig(option.config);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Group By:</span>
      <Select onValueChange={handleValueChange} value={selectedKey}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder={selectedLabel}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {renderGroup("bySelect", BY_SELECT_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byStatus", BY_STATUS_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byDate", BY_DATE_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byCheckbox", BY_CHECKBOX_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byMultiSelect", BY_MULTI_SELECT_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byText", BY_TEXT_OPTIONS)}
          <SelectSeparator />
          {renderGroup("byNumber", BY_NUMBER_OPTIONS)}
        </SelectContent>
      </Select>
    </div>
  );
}
