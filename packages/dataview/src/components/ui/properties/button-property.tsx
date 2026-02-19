"use client";

import type { ButtonAction } from "../../../types/property.type";
import { Button } from "../button";
import { ButtonGroup } from "../button-group";

interface ButtonPropertyProps {
  buttons: ButtonAction[];
}

/**
 * Renders action buttons for a data row.
 * Receives pre-computed button actions from the value function.
 */
export function ButtonProperty({ buttons }: ButtonPropertyProps) {
  if (buttons.length === 0) {
    return null;
  }

  const renderButton = (action: ButtonAction) => {
    const { label, icon: Icon, onClick, isPending, disabled } = action;

    return (
      <Button
        disabled={disabled || isPending}
        key={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
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
