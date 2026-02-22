"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { Divider } from "./divider";
import { LayoutGroup, motion } from "motion/react";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const groupId = React.useId();
  return (
    <LayoutGroup id={groupId}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn("", className)}
        {...props}
      />
    </LayoutGroup>
  );
}

type TabsTriggerButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "data-state"?: "active" | "inactive";
};

const TabsTriggerButton = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerButtonProps
>(({ className, children, "data-state": dataState, ...rest }, ref) => {
  const isActive = dataState === "active";

  return (
    <button {...rest} ref={ref} className={cn("relative", className)}>
      {children}
      {isActive && (
        <motion.span
          layoutId="current-indicator"
          className="pointer-events-none absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-sidebar-accent"
        />
      )}
    </button>
  );
});

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger {...props} ref={ref} data-slot="tabs-trigger" asChild>
    <TabsTriggerButton
      className={cn(
        'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center mr-3 gap-1.5 rounded-lg p-2 text-base/6 font-medium text-zinc-950 sm:text-sm/5 cursor-pointer whitespace-nowrap transition-[color,box-shadow] hover:bg-zinc-950/5 dark:hover:bg-white/5 dark:text-white dark:data-[state=active]:border-input [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 relative',
        className,
      )}
    >
      {children}
    </TabsTriggerButton>
  </TabsPrimitive.Trigger>
));

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
