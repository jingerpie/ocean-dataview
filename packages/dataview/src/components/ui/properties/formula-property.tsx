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
			property={{ id: EMPTY_ID, type: "text" }}
			value={value}
			wrap={wrap}
		/>
	),

	Number: ({ value, config }: PropertyComponentProps<"number">) => (
		<NumberProperty
			property={{ id: EMPTY_ID, type: "number", config }}
			value={value}
		/>
	),

	Select: ({ value, config }: PropertyComponentProps<"select">) => (
		<SelectProperty
			property={{ id: EMPTY_ID, type: "select", config }}
			value={value}
		/>
	),

	MultiSelect: ({ value, config }: PropertyComponentProps<"multiSelect">) => (
		<MultiSelectProperty
			property={{ id: EMPTY_ID, type: "multiSelect", config }}
			value={value}
		/>
	),

	Status: ({ value, config }: PropertyComponentProps<"status">) => (
		<StatusProperty
			property={{ id: EMPTY_ID, type: "status", config }}
			value={value}
		/>
	),

	Date: ({ value, config }: PropertyComponentProps<"date">) => (
		<DateProperty
			property={{ id: EMPTY_ID, type: "date", config }}
			value={value}
		/>
	),

	Checkbox: ({ value }: PropertyComponentProps<"checkbox">) => (
		<CheckboxProperty
			property={{ id: EMPTY_ID, type: "checkbox" }}
			value={value}
		/>
	),

	Url: ({ value, config }: PropertyComponentProps<"url">) => (
		<UrlProperty
			property={{ id: EMPTY_ID, type: "url", config }}
			value={value}
		/>
	),

	Email: ({ value, config }: PropertyComponentProps<"email">) => (
		<EmailProperty
			property={{ id: EMPTY_ID, type: "email", config }}
			value={value}
		/>
	),

	Phone: ({ value, config }: PropertyComponentProps<"phone">) => (
		<PhoneProperty
			property={{ id: EMPTY_ID, type: "phone", config }}
			value={value}
		/>
	),

	FilesMedia: ({
		value,
		config,
		wrap = false,
	}: PropertyComponentProps<"filesMedia">) => (
		<FilesMediaProperty
			property={{ id: EMPTY_ID, type: "filesMedia", config }}
			value={value}
			wrap={wrap}
		/>
	),
};
