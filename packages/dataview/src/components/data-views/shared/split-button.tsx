"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { MoreVertical } from "lucide-react";
import * as React from "react";

export interface DropdownAction {
	label: string;
	onClick: () => void;
	className?: string;
}

interface SplitButtonProps {
	/**
	 * Label for the primary action button
	 */
	primaryLabel?: string;

	/**
	 * Icon for the primary action button
	 */
	primaryIcon?: React.ReactNode;

	/**
	 * Primary action callback
	 */
	onPrimaryAction: () => void;

	/**
	 * Additional actions shown in dropdown
	 */
	dropdownActions: DropdownAction[];

	/**
	 * Button size
	 */
	size?: "default" | "sm" | "lg";
}

/**
 * SplitButton - Combined button with primary action and dropdown menu
 * Primary button triggers main action
 * Secondary button opens dropdown with additional actions
 */
export function SplitButton({
	primaryLabel,
	primaryIcon,
	onPrimaryAction,
	dropdownActions,
	size = "default",
}: SplitButtonProps) {
	const [open, setOpen] = React.useState(false);

	const buttonVariants = {
		sm: {
			text: "text-xs",
			icon: "h-3 w-3",
			dropdownWidth: "w-6",
		},
		default: {
			text: "text-sm",
			icon: "h-4 w-4",
			dropdownWidth: "w-9",
		},
		lg: {
			text: "text-base",
			icon: "h-5 w-5",
			dropdownWidth: "w-10",
		},
	} as const;

	const currentSize = buttonVariants[size];

	const handleActionClick = (action: DropdownAction) => {
		// Close the dropdown first
		setOpen(false);

		// Use setTimeout to ensure dropdown is fully closed before executing action
		setTimeout(() => {
			action.onClick();
		}, 10);
	};

	return (
		<div className="flex gap-[0.5px]">
			<Button
				className={cn("rounded-r-none", currentSize.text)}
				size={size}
				onClick={onPrimaryAction}
			>
				<span className="flex">
					{primaryIcon && (
						<span className={cn("mr-2", currentSize.icon)}>{primaryIcon}</span>
					)}
					{primaryLabel}
				</span>
			</Button>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						className={cn("rounded-l-none", currentSize.dropdownWidth)}
						size={size}
					>
						<MoreVertical className={currentSize.icon} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{dropdownActions.map((action, index) => (
						<DropdownMenuItem
							key={`${action.label}-${index}`}
							className={cn("cursor-pointer", action.className)}
							onClick={() => handleActionClick(action)}
						>
							{action.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
