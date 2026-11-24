import * as React from "react";
import { cn } from "@/lib/utils";

/** Lightweight native select styled like shadcn inputs. */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
