"use client";

import { cn } from "@ocean-dataview/ui/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import type {
	NameType,
	Payload,
	ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { Props as LegendProps } from "recharts/types/component/Legend";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
	[k in string]: {
		label?: React.ReactNode;
		icon?: React.ComponentType;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

type ChartContextProps = {
	config: ChartConfig;
};

export type CustomTooltipProps = Partial<
	TooltipContentProps<ValueType, NameType>
> & {
	className?: string;
	hideLabel?: boolean;
	hideIndicator?: boolean;
	hideZeroValues?: boolean;
	indicator?: "line" | "dot" | "dashed";
	nameKey?: string;
	labelKey?: string;
	labelFormatter?: (
		label: TooltipContentProps<number, string>["label"],
		payload: TooltipContentProps<number, string>["payload"],
	) => React.ReactNode;
	formatter?: (
		value: number | string,
		name: string,
		item: Payload<number | string, string>,
		index: number,
		payload: ReadonlyArray<Payload<number | string, string>>,
	) => React.ReactNode;
	labelClassName?: string;
	color?: string;
};

export type ChartLegendContentProps = Pick<
	LegendProps,
	"verticalAlign" | "align" | "layout" | "iconType" | "formatter"
> & {
	className?: string;
	hideIcon?: boolean;
	payload?: ReadonlyArray<LegendPayload>;
	nameKey?: string;
	onClick?: LegendProps["onClick"];
	onMouseOver?: LegendProps["onMouseEnter"];
	onMouseOut?: LegendProps["onMouseLeave"];
	// Interactive legend styling state (optional)
	legendState?: {
		hiddenItems: Record<string, boolean>;
		hoveredItem: string | null;
	};
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);

	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}

	return context;
}

function ChartContainer({
	id,
	className,
	children,
	config,
	...props
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
	children: React.ComponentProps<
		typeof RechartsPrimitive.ResponsiveContainer
	>["children"];
}) {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-slot="chart"
				data-chart={chartId}
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
					className,
				)}
				{...props}
			>
				<ChartStyle id={chartId} config={config} />
				<RechartsPrimitive.ResponsiveContainer>
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
	const colorConfig = Object.entries(config).filter(
		([, config]) => config.theme || config.color,
	);

	const styleRef = React.useRef<HTMLStyleElement>(null);

	React.useEffect(() => {
		if (styleRef.current) {
			const cssContent = Object.entries(THEMES)
				.map(
					([theme, prefix]) => `
            ${prefix} [data-chart=${id}] {
            ${colorConfig
							.map(([key, itemConfig]) => {
								const color =
									itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
									itemConfig.color;
								return color ? `  --color-${key}: ${color};` : null;
							})
							.join("\n")}
            }
            `,
				)
				.join("\n");
			styleRef.current.textContent = cssContent;
		}
	}, [id, colorConfig]);

	if (!colorConfig.length) {
		return null;
	}

	return <style ref={styleRef} />;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
	active,
	payload,
	label,
	className,
	indicator = "dot",
	hideLabel = false,
	hideIndicator = false,
	hideZeroValues = false,
	labelFormatter,
	formatter,
	labelClassName,
	color,
	nameKey,
	labelKey,
}: CustomTooltipProps) {
	const { config } = useChart();

	const tooltipLabel = React.useMemo(() => {
		if (hideLabel || !payload?.length) {
			return null;
		}

		const [item] = payload;
		const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
		const itemConfig = getPayloadConfigFromPayload(config, item, key);
		const value = (() => {
			const v =
				!labelKey && typeof label === "string"
					? (config[label as keyof typeof config]?.label ?? label)
					: itemConfig?.label;

			return typeof v === "string" || typeof v === "number" ? v : undefined;
		})();

		if (labelFormatter) {
			return (
				<div className={cn("font-medium", labelClassName)}>
					{labelFormatter(value, payload)}
				</div>
			);
		}

		if (!value) {
			return null;
		}

		return <div className={cn("font-medium", labelClassName)}>{value}</div>;
	}, [
		label,
		labelFormatter,
		payload,
		hideLabel,
		labelClassName,
		config,
		labelKey,
	]);

	if (!active || !payload?.length) {
		return null;
	}

	const nestLabel = payload.length === 1 && indicator !== "dot";

	return (
		<div
			className={cn(
				"grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
				className,
			)}
		>
			{!nestLabel ? tooltipLabel : null}
			<div className="grid gap-1.5">
				{payload
					.filter((item) => {
						// Filter out zero values if hideZeroValues is enabled
						if (hideZeroValues) {
							return (
								item.value !== 0 &&
								item.value !== null &&
								item.value !== undefined
							);
						}
						return item.value !== null && item.value !== undefined;
					})
					.map((item, index) => {
						const key = `${nameKey || item.name || item.dataKey || "value"}`;
						const itemConfig = getPayloadConfigFromPayload(config, item, key);
						const indicatorColor = color || item.payload.fill || item.color;

						return (
							<div
								key={item.dataKey}
								className={cn(
									"flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
									indicator === "dot" && "items-center",
								)}
							>
								{formatter && item?.value !== undefined && item.name ? (
									formatter(item.value, item.name, item, index, item.payload)
								) : (
									<>
										{itemConfig?.icon ? (
											<itemConfig.icon />
										) : (
											!hideIndicator && (
												<div
													className={cn(
														"shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
														{
															"h-2.5 w-2.5": indicator === "dot",
															"w-1": indicator === "line",
															"w-0 border-[1.5px] border-dashed bg-transparent":
																indicator === "dashed",
															"my-0.5": nestLabel && indicator === "dashed",
														},
													)}
													style={
														{
															"--color-bg": indicatorColor,
															"--color-border": indicatorColor,
														} as React.CSSProperties
													}
												/>
											)
										)}
										<div
											className={cn(
												"flex flex-1 justify-between gap-2 leading-none",
												nestLabel ? "items-end" : "items-center",
											)}
										>
											<div className="grid gap-1.5">
												{nestLabel ? tooltipLabel : null}
												<span className="text-muted-foreground">
													{itemConfig?.label || item.name}
												</span>
											</div>
											{item.value && (
												<span className="font-medium font-mono text-foreground tabular-nums">
													{item.value.toLocaleString()}
												</span>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
			</div>
		</div>
	);
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
	className,
	hideIcon = false,
	payload,
	verticalAlign = "bottom",
	align = "center",
	nameKey,
	onClick,
	onMouseOver,
	onMouseOut,
	legendState,
}: ChartLegendContentProps) {
	const { config } = useChart();

	if (!payload?.length) {
		return null;
	}

	// Filter out items without a valid dataKey or with empty values (e.g., label bars)
	const filteredPayload = payload.filter((item) => {
		const dataKeyStr = String(item.dataKey || "");
		const itemConfig = getPayloadConfigFromPayload(config, item, dataKeyStr);
		// Keep items that have a label in config or a non-empty value
		return itemConfig?.label || (item.value && item.value !== "");
	});

	if (!filteredPayload.length) {
		return null;
	}

	// Helper to check if interactive styling should be applied
	const hasInteractiveState = !!legendState;

	// Calculate visible items count for hover dimming logic
	const visibleCount = hasInteractiveState
		? filteredPayload.filter((item) => {
				const key = String(item.dataKey);
				return !legendState.hiddenItems[key];
			}).length
		: filteredPayload.length;

	const enableHoverDimming = hasInteractiveState && visibleCount > 1;

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-4",
				verticalAlign === "top" ? "pb-3" : "pt-3",
				align === "left" && "justify-start",
				align === "center" && "justify-center",
				align === "right" && "justify-end",
				className,
			)}
		>
			{filteredPayload.map((item, index) => {
				const key = `${nameKey || item.dataKey || "value"}`;
				const itemConfig = getPayloadConfigFromPayload(config, item, key);
				const uniqueKey = item.dataKey
					? String(item.dataKey)
					: item.value || index;
				const dataKeyStr = String(item.dataKey);

				// Compute interactive states
				const isHidden =
					hasInteractiveState && legendState.hiddenItems[dataKeyStr];
				const isHovered =
					hasInteractiveState && legendState.hoveredItem === dataKeyStr;
				const isDimmed =
					enableHoverDimming &&
					legendState?.hoveredItem &&
					!isHovered &&
					!isHidden;

				const legendContent = (
					<>
						{itemConfig?.icon && !hideIcon ? (
							<itemConfig.icon />
						) : (
							<div
								className={cn(
									"h-2 w-2 shrink-0 rounded-[2px]",
									hasInteractiveState && "transition-opacity",
								)}
								style={{
									backgroundColor: item.color,
									opacity: isHidden ? 0.4 : 1,
								}}
							/>
						)}
						<span>{itemConfig?.label}</span>
					</>
				);

				const baseClassName = cn(
					"flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
					hasInteractiveState && "transition-opacity",
					isHidden && "line-through opacity-40",
					isDimmed && "opacity-60",
				);

				if (onClick) {
					return (
						<button
							key={uniqueKey}
							type="button"
							className={cn(
								baseClassName,
								"cursor-pointer select-none border-0 bg-transparent p-0",
							)}
							onClick={(e) => onClick?.(item, index, e)}
							onMouseOver={(e) => onMouseOver?.(item, index, e)}
							onMouseOut={(e) => onMouseOut?.(item, index, e)}
							onFocus={(e) =>
								onMouseOver?.(item, index, e as unknown as React.MouseEvent)
							}
							onBlur={(e) =>
								onMouseOut?.(item, index, e as unknown as React.MouseEvent)
							}
						>
							{legendContent}
						</button>
					);
				}

				return (
					<div key={uniqueKey} className={baseClassName}>
						{legendContent}
					</div>
				);
			})}
		</div>
	);
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: unknown,
	key: string,
) {
	if (typeof payload !== "object" || payload === null) {
		return undefined;
	}

	const payloadPayload =
		"payload" in payload &&
		typeof payload.payload === "object" &&
		payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey: string = key;

	if (
		key in payload &&
		typeof payload[key as keyof typeof payload] === "string"
	) {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
	) {
		configLabelKey = payloadPayload[
			key as keyof typeof payloadPayload
		] as string;
	}

	return configLabelKey in config
		? config[configLabelKey]
		: config[key as keyof typeof config];
}

export {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
	type LegendPayload,
};
