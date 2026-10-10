"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative isolate inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/*
 * One indicator per list slides between tabs instead of each tab painting its own active background. Base UI measures
 * the active tab into physical `--active-tab-*` vars, so `left` is correct in RTL too. It sits at -z-10 inside the
 * list's `isolate` stacking context: above the list background, under the tab labels.
 */
const tabsIndicatorVariants = cva(
  "absolute -z-10 transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-card shadow-sm dark:bg-popover",
        line: "bg-foreground group-data-horizontal/tabs:-bottom-px group-data-horizontal/tabs:left-(--active-tab-left) group-data-horizontal/tabs:h-0.5 group-data-horizontal/tabs:w-(--active-tab-width) group-data-vertical/tabs:-end-px group-data-vertical/tabs:top-(--active-tab-top) group-data-vertical/tabs:h-(--active-tab-height) group-data-vertical/tabs:w-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {/* Without `renderBeforeHydration` the SSR'd page shows no active tab until hydration. */}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        renderBeforeHydration
        className={tabsIndicatorVariants({ variant })}
      />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/*
 * The incoming panel slides in from the side the indicator moved toward. `data-activation-direction` is physical,
 * like the indicator, so it matches in RTL. The outgoing panel unmounts at once: animating it out too would stack
 * both panels in the flow for the duration. The 12px offset stays inside the 16px page gutter, so the slide never
 * adds a horizontal scrollbar on phones.
 */
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none",
        "transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none data-starting-style:opacity-0",
        "data-[activation-direction=left]:data-starting-style:-translate-x-3 data-[activation-direction=right]:data-starting-style:translate-x-3",
        "data-[activation-direction=up]:data-starting-style:-translate-y-3 data-[activation-direction=down]:data-starting-style:translate-y-3",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
