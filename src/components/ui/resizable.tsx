"use client"

import type { ComponentProps } from "react"
import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"
import { cn } from "@/lib/utils"

type ResizablePanelGroupProps = ComponentProps<typeof Group> & {
  onLayout?: ComponentProps<typeof Group>["onLayoutChanged"]
  direction?: ComponentProps<typeof Group>["orientation"]
}

const ResizablePanelGroup = ({
  onLayout,
  onLayoutChange,
  onLayoutChanged,
  direction,
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <Group
    orientation={orientation ?? direction}
    onLayoutChange={onLayoutChange}
    onLayoutChanged={onLayout ?? onLayoutChanged}
    {...props}
  />
)

const ResizablePanel = Panel

type ResizableHandleProps = ComponentProps<typeof Separator> & {
  withHandle?: boolean
}

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border transition-all after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 focus-visible:outline-none data-[resize-handle-state=drag]:bg-primary",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border text-slate-400 shadow-sm">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }