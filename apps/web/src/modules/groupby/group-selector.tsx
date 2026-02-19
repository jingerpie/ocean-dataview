"use client";

import type { GroupConfig } from "@sparkyidea/dataview/types";
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
import { parseAsString, useQueryState } from "nuqs";

interface GroupOption {
  config: GroupConfig;
  label: string;
  value: string;
}

const BY_SELECT_OPTIONS: GroupOption[] = [
  {
    label: "Select",
    value: "bySelect-category",
    config: { bySelect: { property: "category" } },
  },
];

const BY_STATUS_OPTIONS: GroupOption[] = [
  {
    label: "Status (option)",
    value: "byStatus-availability-option",
    config: { byStatus: { property: "availability", showAs: "option" } },
  },
  {
    label: "Status (group)",
    value: "byStatus-availability-group",
    config: { byStatus: { property: "availability", showAs: "group" } },
  },
];

const BY_DATE_OPTIONS: GroupOption[] = [
  {
    label: "Date (relative)",
    value: "byDate-lastRestocked-relative",
    config: { byDate: { property: "lastRestocked", showAs: "relative" } },
  },
  {
    label: "Date (day)",
    value: "byDate-lastRestocked-day",
    config: { byDate: { property: "lastRestocked", showAs: "day" } },
  },
  {
    label: "Date (week)",
    value: "byDate-lastRestocked-week",
    config: { byDate: { property: "lastRestocked", showAs: "week" } },
  },
  {
    label: "Date (month)",
    value: "byDate-lastRestocked-month",
    config: { byDate: { property: "lastRestocked", showAs: "month" } },
  },
  {
    label: "Date (year)",
    value: "byDate-lastRestocked-year",
    config: { byDate: { property: "lastRestocked", showAs: "year" } },
  },
];

const BY_CHECKBOX_OPTIONS: GroupOption[] = [
  {
    label: "Checkbox",
    value: "byCheckbox-featured",
    config: { byCheckbox: { property: "featured" } },
  },
];

const BY_MULTI_SELECT_OPTIONS: GroupOption[] = [
  {
    label: "Multi Select",
    value: "byMultiSelect-tags",
    config: { byMultiSelect: { property: "tags" } },
  },
];

const BY_TEXT_OPTIONS: GroupOption[] = [
  {
    label: "Text (exact)",
    value: "byText-productName-exact",
    config: { byText: { property: "productName", showAs: "exact" } },
  },
  {
    label: "Text (alphabetical)",
    value: "byText-productName-alphabetical",
    config: { byText: { property: "productName", showAs: "alphabetical" } },
  },
];

const BY_NUMBER_OPTIONS: GroupOption[] = [
  {
    label: "Number (0-500, step 100)",
    value: "byNumber-price-range",
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

const DEFAULT_GROUP = "bySelect-category";

export function useGroupConfig() {
  const [groupValue, setGroupValue] = useQueryState(
    "group",
    parseAsString.withDefault(DEFAULT_GROUP)
  );

  const selectedOption =
    ALL_OPTIONS.find((opt) => opt.value === groupValue) ?? ALL_OPTIONS[0];

  return {
    groupValue,
    setGroupValue,
    groupConfig: selectedOption?.config,
  };
}

function renderGroup(label: string, options: GroupOption[]) {
  return (
    <SelectGroup>
      <SelectLabel>{label}</SelectLabel>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectGroup>
  );
}

export function GroupSelector() {
  const { groupValue, setGroupValue } = useGroupConfig();

  const selectedLabel =
    ALL_OPTIONS.find((opt) => opt.value === groupValue)?.label ?? "Select...";

  const handleValueChange = (value: string | null) => {
    if (value) {
      void setGroupValue(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Group By:</span>
      <Select onValueChange={handleValueChange} value={groupValue}>
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
