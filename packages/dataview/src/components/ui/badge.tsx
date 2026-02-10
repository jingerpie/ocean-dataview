import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        gray: "border-transparent bg-badge-gray text-badge-gray-foreground [a]:hover:bg-badge-gray/80",
        "gray-subtle":
          "border-transparent bg-badge-gray-subtle text-badge-gray-subtle-foreground [a]:hover:border-badge-gray-subtle-foreground",
        blue: "border-transparent bg-badge-blue text-badge-blue-foreground [a]:hover:bg-badge-blue/80",
        "blue-subtle":
          "border-transparent bg-badge-blue-subtle text-badge-blue-subtle-foreground [a]:hover:border-badge-blue-subtle-foreground",
        purple:
          "border-transparent bg-badge-purple text-badge-purple-foreground [a]:hover:bg-badge-purple/80",
        "purple-subtle":
          "border-transparent bg-badge-purple-subtle text-badge-purple-subtle-foreground [a]:hover:border-badge-purple-subtle-foreground",
        yellow:
          "border-transparent bg-badge-yellow text-badge-yellow-foreground [a]:hover:bg-badge-yellow/80",
        "yellow-subtle":
          "border-transparent bg-badge-yellow-subtle text-badge-yellow-subtle-foreground [a]:hover:border-badge-yellow-subtle-foreground",
        orange:
          "border-transparent bg-badge-orange text-badge-orange-foreground [a]:hover:bg-badge-orange/80",
        "orange-subtle":
          "border-transparent bg-badge-orange-subtle text-badge-orange-subtle-foreground [a]:hover:border-badge-orange-subtle-foreground",
        red: "border-transparent bg-badge-red text-badge-red-foreground [a]:hover:bg-badge-red/80",
        "red-subtle":
          "border-transparent bg-badge-red-subtle text-badge-red-subtle-foreground [a]:hover:border-badge-red-subtle-foreground",
        pink: "border-transparent bg-badge-pink text-badge-pink-foreground [a]:hover:bg-badge-pink/80",
        "pink-subtle":
          "border-transparent bg-badge-pink-subtle text-badge-pink-subtle-foreground [a]:hover:border-badge-pink-subtle-foreground",
        green:
          "border-transparent bg-badge-green text-badge-green-foreground [a]:hover:bg-badge-green/80",
        "green-subtle":
          "border-transparent bg-badge-green-subtle text-badge-green-subtle-foreground [a]:hover:border-badge-green-subtle-foreground",
        teal: "border-transparent bg-badge-teal text-badge-teal-foreground [a]:hover:bg-badge-teal/80",
        "teal-subtle":
          "border-transparent bg-badge-teal-subtle text-badge-teal-subtle-foreground [a]:hover:border-badge-teal-subtle-foreground",
        inverted:
          "border-transparent bg-badge-inverted text-badge-inverted-foreground [a]:hover:bg-badge-inverted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
