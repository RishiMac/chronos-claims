"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasscodeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function PasscodeInput({
  id,
  value,
  onChange,
  placeholder = "Enter passcode",
  className,
  inputClassName,
}: PasscodeInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-md border border-slate-200 bg-white py-2 pl-3 pr-10 text-[13px] text-slate-700 outline-none focus:border-slate-400",
          inputClassName
        )}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        aria-label={visible ? "Hide passcode" : "Show passcode"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
