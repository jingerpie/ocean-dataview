/**
 * Type registry for renderer-specific types.
 *
 * Core types stay free of any UI framework. A renderer (the React layer)
 * augments this interface to plug in its own icon and node types:
 *
 * ```ts
 * declare module "./types/register" {
 *   interface DataViewRegister {
 *     icon: ComponentType<SVGProps<SVGSVGElement>>;
 *     node: ReactNode;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: Augmented by renderers
export interface DataViewRegister {}

/** Icon type supplied by the renderer, or `unknown` when none is registered. */
export type IconComponent = DataViewRegister extends { icon: infer TIcon }
  ? TIcon
  : unknown;

/** Renderable node type supplied by the renderer, or `unknown`. */
export type RenderNode = DataViewRegister extends { node: infer TNode }
  ? TNode
  : unknown;
