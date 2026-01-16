"use client";

import { Phone } from "lucide-react";
import type { PhonePropertyType } from "../../../types/property-types";

interface PhonePropertyProps<T> {
	value: unknown;
	property: PhonePropertyType<T>;
}

export function PhoneProperty<T>({ value, property }: PhonePropertyProps<T>) {
	if (!value) {
		return <span className="text-muted-foreground text-sm">-</span>;
	}

	const phone = String(value);
	const showAsLink = property.config?.showAsLink ?? true;
	const format = property.config?.format ?? "none";

	let formattedPhone = phone;

	// Format phone number
	if (format === "US") {
		// Format as (XXX) XXX-XXXX
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.length === 10) {
			formattedPhone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		} else if (cleaned.length === 11 && cleaned[0] === "1") {
			formattedPhone = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
		}
	} else if (format === "international" && !phone.startsWith("+")) {
		// Keep as is but ensure it starts with +
		formattedPhone = `+${phone}`;
	}

	if (!showAsLink) {
		return <span className="text-sm">{formattedPhone}</span>;
	}

	return (
		<a
			className="inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800 hover:underline"
			href={`tel:${phone}`}
			onClick={(e) => e.stopPropagation()}
		>
			<Phone className="h-3 w-3 flex-shrink-0" />
			<span className="truncate">{formattedPhone}</span>
		</a>
	);
}
