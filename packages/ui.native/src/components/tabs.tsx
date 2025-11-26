import { createContext, useContext, useState, type ReactNode } from "react"
import { View, Pressable } from "react-native"
import { cn } from "@_/ui.utils"
import { Text } from "./text"

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("Tabs components must be used within Tabs")
  return ctx
}

type TabsProps = {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View className={cn("flex flex-col gap-2", className)}>{children}</View>
    </TabsContext.Provider>
  )
}

type TabsListProps = {
  children: ReactNode
  className?: string
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <View
      className={cn(
        "flex-row bg-muted rounded-lg p-1",
        className
      )}
    >
      {children}
    </View>
  )
}

type TabsTriggerProps = {
  value: string
  children: ReactNode
  className?: string
}

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs()
  const isActive = value === selectedValue

  return (
    <Pressable
      onPress={() => onValueChange(value)}
      className={cn(
        "flex-1 items-center justify-center rounded-md py-2 px-3",
        isActive && "bg-background shadow-sm",
        className
      )}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
      </Text>
    </Pressable>
  )
}

type TabsContentProps = {
  value: string
  children: ReactNode
  className?: string
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs()

  if (value !== selectedValue) return null

  return <View className={cn("flex-1", className)}>{children}</View>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
