"use client";

import type { PropertyComponentProps } from "../../../types/formula-property.type";
import { CheckboxProperty } from "./checkbox-property";
import { DateProperty } from "./date-property";
import { EmailProperty } from "./email-property";
import { FilesMediaProperty } from "./files-media-property";
import { MultiSelectProperty } from "./multi-select-property";
import { NumberProperty } from "./number-property";
import { PhoneProperty } from "./phone-property";
import { SelectProperty } from "./select-property";
import { StatusProperty } from "./status-property";
import { TextProperty } from "./text-property";
import { UrlProperty } from "./url-property";

// Type-safe empty id for property components used in formula types
// These components don't need a real id since they're used standalone
type EmptyObject = Record<string, never>;
const EMPTY_ID = "" as keyof EmptyObject;

/**
 * Property component namespace for use in formula property types
 * Provides pre-built components that match each property type
 *
 * @example
 * import { Property } from "@ocean-dataview/dataview/data-views";
 *
 * {
 *   id: "summary",
 *   type: "formula",
 *   value: (_, item) => (
 *     <div className="flex gap-2">
 *       <Property.Text value={item.title} />
 *       <Property.Number value={item.price} config={{ numberFormat: "dollar" }} />
 *     </div>
 *   )
 * }
 */
export const Property = {
	Text: ({ value, wrap = false }: PropertyComponentProps<"text">) => (
		<TextProperty
			value={value}
			property={{ id: EMPTY_ID, type: "text" }}
			wrap={wrap}
		/>
	),

	Number: ({ value, config }: PropertyComponentProps<"number">) => (
		<NumberProperty
			value={value}
			property={{ id: EMPTY_ID, type: "number", config }}
		/>
	),

	Select: ({ value, config }: PropertyComponentProps<"select">) => (
		<SelectProperty
			value={value}
			property={{ id: EMPTY_ID, type: "select", config }}
		/>
	),

	MultiSelect: ({ value, config }: PropertyComponentProps<"multiSelect">) => (
		<MultiSelectProperty
			value={value}
			property={{ id: EMPTY_ID, type: "multiSelect", config }}
		/>
	),

	Status: ({ value, config }: PropertyComponentProps<"status">) => (
		<StatusProperty
			value={value}
			property={{ id: EMPTY_ID, type: "status", config }}
		/>
	),

	Date: ({ value, config }: PropertyComponentProps<"date">) => (
		<DateProperty
			value={value}
			property={{ id: EMPTY_ID, type: "date", config }}
		/>
	),

	Checkbox: ({ value }: PropertyComponentProps<"checkbox">) => (
		<CheckboxProperty
			value={value}
			property={{ id: EMPTY_ID, type: "checkbox" }}
		/>
	),

	Url: ({ value, config }: PropertyComponentProps<"url">) => (
		<UrlProperty
			value={value}
			property={{ id: EMPTY_ID, type: "url", config }}
		/>
	),

	Email: ({ value, config }: PropertyComponentProps<"email">) => (
		<EmailProperty
			value={value}
			property={{ id: EMPTY_ID, type: "email", config }}
		/>
	),

	Phone: ({ value, config }: PropertyComponentProps<"phone">) => (
		<PhoneProperty
			value={value}
			property={{ id: EMPTY_ID, type: "phone", config }}
		/>
	),

	FilesMedia: ({
		value,
		config,
		wrap = false,
	}: PropertyComponentProps<"filesMedia">) => (
		<FilesMediaProperty
			value={value}
			property={{ id: EMPTY_ID, type: "filesMedia", config }}
			wrap={wrap}
		/>
	),
};
