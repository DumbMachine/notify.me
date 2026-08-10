"use client"

import * as React from "react"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { cn } from "@workspace/ui/lib/utils"

function BottomSheet({
  showSwipeHandle = true,
  ...props
}: React.ComponentProps<typeof Drawer>) {
  return (
    <Drawer
      swipeDirection="down"
      showSwipeHandle={showSwipeHandle}
      {...props}
    />
  )
}

function BottomSheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerContent>) {
  return (
    <DrawerContent
      className={cn(
        "mx-auto w-full max-w-lg overflow-hidden bg-card text-card-foreground [--drawer-bleed-background:var(--color-card)]",
        className
      )}
      {...props}
    >
      {children}
    </DrawerContent>
  )
}

function BottomSheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <DrawerHeader
      className={cn("gap-2 px-6 pt-2 pb-1 text-left md:text-left", className)}
      {...props}
    />
  )
}

function BottomSheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <DrawerFooter
      className={cn(
        "gap-2 px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  )
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerTitle>) {
  return (
    <DrawerTitle
      className={cn(
        "font-heading text-2xl font-medium tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerDescription>) {
  return (
    <DrawerDescription
      className={cn(
        "text-[15px]/relaxed leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function BottomSheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3",
        className
      )}
      {...props}
    />
  )
}

function BottomSheetClose({
  ...props
}: React.ComponentProps<typeof DrawerClose>) {
  return <DrawerClose {...props} />
}

export {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
}
