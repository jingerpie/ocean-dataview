"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import { useIsomorphicLayoutEffect, useResizeObserver } from "usehooks-ts";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";

interface LegendItem {
	name: string;
	color: string;
}

interface PaginatedLegendProps {
	items: LegendItem[];
	legendState?: {
		hiddenItems: Record<string, boolean>;
		hoveredItem: string | null;
	};
	onClick?: (data: LegendPayload, index: number, e: React.MouseEvent) => void;
	onMouseOver?: (
		data: LegendPayload,
		index: number,
		e: React.MouseEvent,
	) => void;
	onMouseOut?: (
		data: LegendPayload,
		index: number,
		e: React.MouseEvent,
	) => void;
	className?: string;
}

// Pagination constants
const VISIBLE_ROWS = 4;
const SCROLL_ROWS = 3;

// Empty object to avoid creating new object on every render
const EMPTY_HIDDEN_ITEMS: Record<string, boolean> = {};

export function PaginatedLegend({
	items,
	legendState,
	onClick,
	onMouseOver,
	onMouseOut,
	className,
}: PaginatedLegendProps) {
	// Refs
	const viewportRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	// State for pagination
	const [currentTopRow, setCurrentTopRow] = useState(0);
	const [rowHeight, setRowHeight] = useState(0);
	const [totalRows, setTotalRows] = useState(0);

	// Extract state values - simple destructuring, no need for useMemo
	const hiddenItems = legendState?.hiddenItems ?? EMPTY_HIDDEN_ITEMS;
	const hoveredItem = legendState?.hoveredItem ?? null;

	// Calculate derived values inline - these are cheap operations
	const visibleCount = items.filter((item) => !hiddenItems[item.name]).length;
	const enableHoverDimming = visibleCount > 1 && hoveredItem !== null;
	const canScrollUp = currentTopRow > 0;
	const canScrollDown = currentTopRow < totalRows - VISIBLE_ROWS;
	const hasOverflow = totalRows > VISIBLE_ROWS;
	const translateY = rowHeight > 0 ? -(currentTopRow * rowHeight) : 0;

	// Measure grid layout
	const measureGrid = useCallback(() => {
		if (!gridRef.current) return;

		const grid = gridRef.current;
		const gridItems = Array.from(grid.children) as HTMLElement[];

		if (gridItems.length === 0) {
			setTotalRows(0);
			setRowHeight(0);
			return;
		}

		// Get computed grid columns to determine columns per row
		const computedStyle = window.getComputedStyle(grid);
		const gridTemplateColumns = computedStyle.gridTemplateColumns;
		const columnsPerRow = gridTemplateColumns.split(" ").length;

		// Calculate total rows
		const calculatedTotalRows = Math.ceil(gridItems.length / columnsPerRow);

		// Get height of first item + gap
		const firstItem = gridItems[0];
		if (!firstItem) return;

		const itemRect = firstItem.getBoundingClientRect();
		const gap = Number.parseFloat(computedStyle.rowGap) || 0;
		const calculatedRowHeight = itemRect.height + gap;

		setTotalRows(calculatedTotalRows);
		setRowHeight(calculatedRowHeight);

		// Reset scroll if current position is out of bounds
		setCurrentTopRow((prev) => {
			if (
				prev >= calculatedTotalRows - VISIBLE_ROWS &&
				calculatedTotalRows > VISIBLE_ROWS
			) {
				return Math.max(0, calculatedTotalRows - VISIBLE_ROWS);
			}
			return prev;
		});
	}, []);

	// Watch for size changes
	useResizeObserver({
		ref: viewportRef as React.RefObject<HTMLElement>,
		onResize: measureGrid,
	});

	// Measure synchronously after items change or mount
	useIsomorphicLayoutEffect(() => {
		measureGrid();
	}, [items, measureGrid]);

	// Scroll handlers - these are stable, no need to memoize
	const handleScrollUp = useCallback(() => {
		setCurrentTopRow((prev) => Math.max(0, prev - SCROLL_ROWS));
	}, []);

	const handleScrollDown = useCallback(() => {
		setCurrentTopRow((prev) =>
			Math.min(totalRows - VISIBLE_ROWS, prev + SCROLL_ROWS),
		);
	}, [totalRows]);

	// Click handlers that create LegendPayload on-demand
	// This avoids pre-creating objects that may never be used
	const handleClick = useCallback(
		(item: LegendItem, index: number, e: React.MouseEvent) => {
			if (onClick) {
				const payload = { dataKey: item.name } as LegendPayload;
				onClick(payload, index, e);
			}
		},
		[onClick],
	);

	const handleMouseOver = useCallback(
		(item: LegendItem, index: number, e: React.MouseEvent) => {
			if (onMouseOver) {
				const payload = { dataKey: item.name } as LegendPayload;
				onMouseOver(payload, index, e);
			}
		},
		[onMouseOver],
	);

	const handleMouseOut = useCallback(
		(item: LegendItem, index: number, e: React.MouseEvent) => {
			if (onMouseOut) {
				const payload = { dataKey: item.name } as LegendPayload;
				onMouseOut(payload, index, e);
			}
		},
		[onMouseOut],
	);

	return (
		<div className={cn("@container w-full", className)}>
			{/* Legend Items Viewport */}
			<div
				ref={viewportRef}
				className="overflow-hidden"
				style={{
					height:
						rowHeight > 0 && hasOverflow
							? `${VISIBLE_ROWS * rowHeight}px`
							: "auto",
					maxHeight: "112px", // 4 rows * ~28px - prevents flash before measurement
				}}
			>
				<div
					ref={gridRef}
					className={cn(
						"-mr-4 grid grid-flow-row place-content-center gap-y-3 space-x-4 transition-transform duration-300 ease-in-out",
						"@[316px]:grid-cols-[repeat(2,max-content)]",
						"@[482px]:grid-cols-[repeat(3,max-content)]",
						"@[648px]:grid-cols-[repeat(4,max-content)]",
						"@[814px]:grid-cols-[repeat(5,max-content)]",
						"@[980px]:grid-cols-[repeat(6,max-content)]",
						"@[1146px]:grid-cols-[repeat(7,max-content)]",
					)}
					style={{
						transform: hasOverflow ? `translateY(${translateY}px)` : undefined,
					}}
				>
					{items.map((item, index) => {
						const isHidden = hiddenItems[item.name];
						const isHovered = hoveredItem === item.name;
						const isDimmed = enableHoverDimming && !isHovered && !isHidden;

						const legendContent = (
							<>
								<div
									className="h-2 w-2 shrink-0 rounded-[2px] transition-opacity"
									style={{
										backgroundColor: item.color,
										opacity: isHidden ? 0.4 : 1,
									}}
								/>
								<span className="truncate text-xs">{item.name}</span>
							</>
						);

						const baseClassName = cn(
							"flex max-w-[150px] items-center gap-1.5 transition-opacity",
							isHidden && "line-through opacity-40",
							isDimmed && "opacity-60",
						);

						if (onClick) {
							return (
								<button
									key={item.name}
									type="button"
									className={cn(
										baseClassName,
										"cursor-pointer select-none border-0 bg-transparent p-0 text-left",
									)}
									onClick={(e) => handleClick(item, index, e)}
									onMouseEnter={(e) => handleMouseOver(item, index, e)}
									onMouseLeave={(e) => handleMouseOut(item, index, e)}
									onFocus={(e) =>
										handleMouseOver(
											item,
											index,
											e as unknown as React.MouseEvent,
										)
									}
									onBlur={(e) =>
										handleMouseOut(
											item,
											index,
											e as unknown as React.MouseEvent,
										)
									}
								>
									{legendContent}
								</button>
							);
						}

						return (
							<div key={item.name} className={baseClassName}>
								{legendContent}
							</div>
						);
					})}
				</div>
			</div>

			{/* Scroll Controls */}
			{hasOverflow && (
				<div className="flex items-center justify-center gap-2 pt-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5 p-0"
						onClick={handleScrollUp}
						disabled={!canScrollUp}
						aria-label="Scroll up"
					>
						<ChevronUp className="h-3 w-3" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5 p-0"
						onClick={handleScrollDown}
						disabled={!canScrollDown}
						aria-label="Scroll down"
					>
						<ChevronDown className="h-3 w-3" />
					</Button>
				</div>
			)}
		</div>
	);
}
