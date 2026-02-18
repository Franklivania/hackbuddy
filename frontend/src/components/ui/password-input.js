"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton, } from "./input-group";
const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (_jsxs(InputGroup, { className: cn("pr-0", className), children: [_jsx(InputGroupInput, { ref: ref, type: visible ? "text" : "password", autoComplete: props.autoComplete ?? "off", "data-password-toggle": true, ...props }), _jsx(InputGroupAddon, { align: "inline-end", className: "pl-1 pr-2", children: _jsx(InputGroupButton, { type: "button", variant: "ghost", size: "icon-sm", onClick: () => setVisible((v) => !v), tabIndex: -1, "aria-label": visible ? "Hide password" : "Show password", children: visible ? (_jsx(EyeOff, { className: "size-4 text-muted-foreground" })) : (_jsx(Eye, { className: "size-4 text-muted-foreground" })) }) })] }));
});
PasswordInput.displayName = "PasswordInput";
export { PasswordInput };
