"use client";
import { type VariantProps } from "@workspace/lib/utils";
import { Button, buttonVariants } from "../components/button";
import { useState } from "react";
interface CopyButtonProps extends VariantProps<typeof buttonVariants> {
  toBeCopied: string;
  children: React.ReactNode;
}
// todo: make the children dimmed and disabled for 2 sec after clicking
export default function CopyButton({
  toBeCopied,
  children,
  ...props
}: CopyButtonProps) {
  const [disabled, setDisabled] = useState(false);
  return (
    <Button
      disabled={disabled}
      onClick={() => {
        navigator.clipboard.writeText(toBeCopied);
        setDisabled(true);
        setTimeout(() => setDisabled(false), 2000);
      }}
      {...props}
    >
      <div className={disabled ? "opacity-50" : ""}>{children}</div>
    </Button>
  );
}
