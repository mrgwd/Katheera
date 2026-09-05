"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn, type VariantProps } from "@workspace/lib/utils";
import { buttonVariants } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
