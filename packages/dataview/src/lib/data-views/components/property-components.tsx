"use client";

import { CheckboxProperty } from "../properties/checkbox-property";
import { DateProperty } from "../properties/date-property";
import { EmailProperty } from "../properties/email-property";
import { FilesMediaProperty } from "../properties/files-media-property";
import { MultiSelectProperty } from "../properties/multi-select-property";
import { NumberProperty } from "../properties/number-property";
import { PhoneProperty } from "../properties/phone-property";
import { SelectProperty } from "../properties/select-property";
import { StatusProperty } from "../properties/status-property";
import { TextProperty } from "../properties/text-property";
import { UrlProperty } from "../properties/url-property";
import type { PropertyComponentProps } from "./property-component-types";

// Type-safe empty id for property components used in custom types
// These components don't need a real id since they're used standalone
type EmptyObject = Record<string, never>;
const EMPTY_ID = "" as keyof EmptyObject;

/**
 * Property component namespace for use in custom property types
 * Provides pre-built components that match each property type
 *
 * @example
 * import { Property } from "@ocean-dataview/dataview/data-views";
 *
 * {
 *   id: "summary",
 *   type: "custom",
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

	MultiSelect: ({ value, config }: PropertyComponentProps<"multi-select">) => (
		<MultiSelectProperty
			value={value}
			property={{ id: EMPTY_ID, type: "multi-select", config }}
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
	}: PropertyComponentProps<"files-media">) => (
		<FilesMediaProperty
			value={value}
			property={{ id: EMPTY_ID, type: "files-media", config }}
			wrap={wrap}
		/>
	),
};
