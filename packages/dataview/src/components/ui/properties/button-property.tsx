"use client";

import type { ButtonAction, ButtonConfig } from "../../../types/property.type";
import { Button } from "../button";
import { ButtonGroup } from "../button-group";

interface ButtonPropertyProps<T> {
  config: ButtonConfig<T>;
  item: T;
}

/**
 * Renders action buttons for a data row.
 * For more complex button configurations, use formula property.
 */
export function ButtonProperty<T>({ config, item }: ButtonPropertyProps<T>) {
  const { buttons } = config;

  if (buttons.length === 0) {
    return null;
  }

  const renderButton = (action: ButtonAction<T>) => {
    const { label, icon: Icon, onClick, isPending, disabled } = action;

    return (
      <Button
        disabled={disabled || isPending}
        key={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick(item);
        }}
        variant="outline"
      >
        {Icon && <Icon data-icon="inline-start" />}
        {label}
      </Button>
    );
  };

  // Single button - no need for ButtonGroup wrapper
  if (buttons.length === 1 && buttons[0]) {
    return renderButton(buttons[0]);
  }

  // Multiple buttons - use ButtonGroup
  return (
    <ButtonGroup orientation="horizontal">
      {buttons.map((action) => renderButton(action))}
    </ButtonGroup>
  );
}
