"use client";

import { useState } from "react";

type Props = {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * A button that asks for confirmation inline instead of via a native
 * `confirm()` dialog. First click swaps the trigger for "confirm / cancel"
 * controls; no blocking browser modal, works on touch, and matches app styling.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Confirm",
  disabled,
  className,
  ...rest
}: Props) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="text-xs font-medium text-destructive hover:opacity-80 transition-opacity px-1"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setConfirming(true)}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
