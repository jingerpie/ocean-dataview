"use client";

import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { useRef } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { InputGroup, InputGroupAddon } from "./input-group";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
      data-slot="command"
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="p-1.5 pb-1" data-slot="command-input-wrapper">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          data-slot="input-group-control"
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-y-auto overflow-x-hidden outline-none",
        className
      )}
      data-slot="command-list"
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("py-6 text-center text-sm", className)}
      data-slot="command-empty"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:text-xs",
        className
      )}
      data-slot="command-group"
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px bg-border", className)}
      data-slot="command-separator"
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "group/command-item relative flex cursor-default select-none items-center gap-2 in-data-[slot=dialog-content]:rounded-lg! rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-selected:bg-muted data-selected:text-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-selected:*:[svg]:text-foreground",
        className
      )}
      data-slot="command-item"
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto hidden group-data-[checked=true]/command-item:block" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-muted-foreground text-xs tracking-widest group-data-selected/command-item:text-foreground",
        className
      )}
      data-slot="command-shortcut"
      {...props}
    />
  );
}

function CommandChips({
  className,
  children,
  onClearAll,
  showClearAll = true,
  ...props
}: React.ComponentPropsWithRef<"div"> & {
  onClearAll?: () => void;
  showClearAll?: boolean;
}) {
  return (
    <div className="p-1.5 pb-1" data-slot="command-chips-wrapper">
      <div
        className={cn(
          "flex min-h-8 items-start justify-between rounded-lg border border-input/30 bg-input/30 px-2.5 py-1 text-sm shadow-none transition-colors has-[[data-slot=input-group-control]:focus-visible]:border-ring has-data-[slot=command-chip]:px-1.5 has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
          className
        )}
        data-slot="command-chips"
        {...props}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {children}
        </div>
        {showClearAll && onClearAll && (
          <Button
            className="size-5.5 text-muted-foreground"
            data-slot="command-chips-clear"
            onClick={onClearAll}
            variant="ghost"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CommandChip({
  className,
  children,
  showRemove = true,
  onRemove,
  disabled,
  ...props
}: React.ComponentPropsWithRef<"div"> & {
  showRemove?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 whitespace-nowrap rounded-sm bg-muted px-1.5 font-medium text-foreground text-xs has-data-[slot=command-chip-remove]:pr-0 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      data-disabled={disabled || undefined}
      data-slot="command-chip"
      {...props}
    >
      {children}
      {showRemove && (
        <Button
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="command-chip-remove"
          disabled={disabled}
          onClick={onRemove}
          size="icon-xs"
          variant="ghost"
        >
          <XIcon className="pointer-events-none" />
        </Button>
      )}
    </div>
  );
}

function CommandChipsInput({
  className,
  autoFocus = true,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <CommandPrimitive.Input
      autoFocus={autoFocus}
      className={cn("min-w-16 flex-1 outline-none", className)}
      data-slot="input-group-control"
      {...props}
    />
  );
}

function useCommandAnchor() {
  return useRef<HTMLDivElement | null>(null);
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandChips,
  CommandChip,
  CommandChipsInput,
  useCommandAnchor,
};
