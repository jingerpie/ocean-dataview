"use client";

import {
	Table,
	TableHead,
	TableHeader,
	TableRow,
} from "@ocean-dataview/ui/components/table";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DataTableStickyHeaderProps<TData> {
	table: TanstackTable<TData>;
	enabled: boolean;
	tableHeaderRef: React.RefObject<HTMLTableSectionElement | null>;
	tableContainerRef: React.RefObject<HTMLDivElement | null>;
	groupTriggerRef?: React.RefObject<HTMLButtonElement | null>;
	offset?: number;
}

export function DataTableStickyHeader<TData>({
	table,
	enabled,
	tableHeaderRef,
	tableContainerRef,
	groupTriggerRef,
	offset = 0,
}: DataTableStickyHeaderProps<TData>) {
	const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
	const [showStickyHeader, setShowStickyHeader] = useState(false);
	const [columnWidths, setColumnWidths] = useState<number[]>([]);
	const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
	const [mounted, setMounted] = useState(false);
	const [stickyTopOffset, setStickyTopOffset] = useState<number>(offset);

	// Shared scroll state for instant synchronization
	const scrollStateRef = useRef({ scrollLeft: 0, isUpdating: false });

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!enabled) {
			setShowStickyHeader(false);
			return;
		}

		const headerElement = tableHeaderRef.current;
		const containerElement = tableContainerRef.current;
		if (!headerElement || !containerElement) return;

		// Calculate sticky top offset - add group trigger height if exists
		const calculateStickyOffset = (): number => {
			if (groupTriggerRef?.current) {
				const triggerHeight =
					groupTriggerRef.current.getBoundingClientRect().height;
				return triggerHeight - 2;
			}
			// No group trigger - flat table uses base offset
			return offset;
		};

		setStickyTopOffset(calculateStickyOffset());

		// Get column widths from the original header
		const updateColumnWidths = () => {
			if (headerElement) {
				const headerCells = headerElement.querySelectorAll("th");
				const widths = Array.from(headerCells).map(
					(cell) => cell.getBoundingClientRect().width,
				);
				setColumnWidths(widths);
			}
		};

		// Update container position for viewport positioning
		const updateContainerRect = () => {
			if (containerElement) {
				setContainerRect(containerElement.getBoundingClientRect());
			}
		};

		// Synchronous scroll update function
		const updateScrollPosition = (newScrollLeft: number) => {
			if (scrollStateRef.current.isUpdating) return;

			scrollStateRef.current.isUpdating = true;
			scrollStateRef.current.scrollLeft = newScrollLeft;

			// Update both containers synchronously
			const stickyScrollElement = stickyHeaderScrollRef.current;

			if (containerElement.scrollLeft !== newScrollLeft) {
				containerElement.scrollLeft = newScrollLeft;
			}

			if (
				stickyScrollElement &&
				stickyScrollElement.scrollLeft !== newScrollLeft
			) {
				stickyScrollElement.scrollLeft = newScrollLeft;
			}

			// Reset flag synchronously (no RAF needed)
			scrollStateRef.current.isUpdating = false;
		};

		// Check if header top is above the sticky threshold
		const checkHeaderPosition = () => {
			const headerRect = headerElement.getBoundingClientRect();
			const containerRect = containerElement.getBoundingClientRect();
			const threshold = offset; // Always use base offset for WHEN to show (not stickyTopOffset)

			// Show sticky header when:
			// 1. The top of the original header goes above the threshold AND
			// 2. We haven't scrolled past the bottom of the table container
			setShowStickyHeader(
				headerRect.top < threshold &&
					containerRect.bottom > threshold + headerRect.height,
			);
		};

		// Initial setup
		updateColumnWidths();
		updateContainerRect();
		checkHeaderPosition();

		// Use scroll-based detection instead of IntersectionObserver for more precise control
		const handleScroll = () => {
			checkHeaderPosition();
			updateContainerRect();
		};

		// Update on resize
		const resizeObserver = new ResizeObserver(() => {
			// Recalculate sticky offset in case accordion trigger height changes
			setStickyTopOffset(calculateStickyOffset());
			updateColumnWidths();
			updateContainerRect();
			checkHeaderPosition();
		});

		resizeObserver.observe(containerElement);

		const handleTableScroll = (e: Event) => {
			const target = e.target as HTMLElement;
			updateScrollPosition(target.scrollLeft);
		};

		// Add event listeners
		window.addEventListener("scroll", handleScroll, { passive: true });
		containerElement.addEventListener("scroll", handleTableScroll, {
			passive: true,
		});

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("scroll", handleScroll);
			containerElement.removeEventListener("scroll", handleTableScroll);
		};
	}, [enabled, tableHeaderRef, tableContainerRef, groupTriggerRef, offset]);

	// Effect for sticky header scroll synchronization
	useEffect(() => {
		if (!enabled) return;

		const stickyScrollElement = stickyHeaderScrollRef.current;
		const containerElement = tableContainerRef.current;

		if (!stickyScrollElement || !containerElement || !showStickyHeader) return;

		// Synchronous scroll update function
		const updateScrollPosition = (newScrollLeft: number) => {
			if (scrollStateRef.current.isUpdating) return;

			scrollStateRef.current.isUpdating = true;
			scrollStateRef.current.scrollLeft = newScrollLeft;

			// Update both containers synchronously
			if (containerElement.scrollLeft !== newScrollLeft) {
				containerElement.scrollLeft = newScrollLeft;
			}

			if (stickyScrollElement.scrollLeft !== newScrollLeft) {
				stickyScrollElement.scrollLeft = newScrollLeft;
			}

			// Reset flag synchronously
			scrollStateRef.current.isUpdating = false;
		};

		const handleStickyScroll = (e: Event) => {
			const target = e.target as HTMLElement;
			updateScrollPosition(target.scrollLeft);
		};

		// Sync initial position immediately
		stickyScrollElement.scrollLeft = scrollStateRef.current.scrollLeft;

		// Add listeners
		stickyScrollElement.addEventListener("scroll", handleStickyScroll, {
			passive: true,
		});

		return () => {
			stickyScrollElement.removeEventListener("scroll", handleStickyScroll);
		};
	}, [enabled, showStickyHeader, tableContainerRef]);

	// Don't render anything if not enabled, not mounted, or conditions not met
	if (
		!enabled ||
		!mounted ||
		!showStickyHeader ||
		!containerRect ||
		columnWidths.length === 0
	) {
		return null;
	}

	// Render the sticky header using a portal
	return createPortal(
		<div
			className="fixed z-50 bg-muted"
			style={{
				top: stickyTopOffset,
				left: Math.max(0, containerRect.left),
				width: Math.min(
					containerRect.width,
					window.innerWidth - Math.max(0, containerRect.left),
				),
			}}
		>
			<div
				ref={stickyHeaderScrollRef}
				className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header, headerIndex) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
										style={{
											...(columnWidths[headerIndex]
												? {
														width: columnWidths[headerIndex],
														minWidth: columnWidths[headerIndex],
														maxWidth: columnWidths[headerIndex],
													}
												: {}),
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
				</Table>
			</div>
		</div>,
		document.body,
	);
}
