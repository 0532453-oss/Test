import { useTranslate } from "ra-core";
import * as React from "react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/atlantis";

/**
 * A button with a tooltip that ensures the tooltip is closed on click to avoid ghost tooltips.
 *
 * Prevents ghost tooltips that can appear when the button position changes after interaction.
 * Supports internationalization for the label text.
 *
 * @example
 * // Basic usage with icon and label
 * <IconButtonWithTooltip label="Delete">
 *   <Trash2 />
 * </IconButtonWithTooltip>
 */
export const IconButtonWithTooltip = ({
  label,
  onClick,
  children,
  disabled,
  ...props
}: IconButtonWithTooltipProps) => {
  const translate = useTranslate();
  const [open, setOpen] = React.useState(false);

  let translatedLabel = label;
  if (typeof label === "string") {
    translatedLabel = translate(label, { _: label });
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    onClick?.(event);
  };

  return (
    <Tooltip
      message={translatedLabel}
      open={open}
      onOpenChange={setOpen}
      placement="top"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          typeof translatedLabel === "string" ? translatedLabel : undefined
        }
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
};

export interface IconButtonWithTooltipProps
  extends React.ComponentProps<"button"> {
  label: React.ReactNode;
  children: React.ReactNode;
}
