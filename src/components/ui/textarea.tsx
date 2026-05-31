import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded-sm border border-input bg-background px-[14px] py-[10px] text-body text-foreground outline-none transition-colors duration-150",
        "placeholder:text-placeholder",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:bg-card disabled:text-placeholder",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
