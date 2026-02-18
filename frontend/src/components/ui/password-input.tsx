"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "../../lib/utils";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "./input-group";

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  className?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <InputGroup className={cn("pr-0", className)}>
        <InputGroupInput
          ref={ref}
          type={visible ? "text" : "password"}
          autoComplete={props.autoComplete ?? "off"}
          data-password-toggle
          {...props}
        />
        <InputGroupAddon align="inline-end" className="pl-1 pr-2">
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff className="size-4 text-muted-foreground" />
            ) : (
              <Eye className="size-4 text-muted-foreground" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
