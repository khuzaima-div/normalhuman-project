"use client"

import * as React from "react"

const ThreadContext = React.createContext<
  [string | null, React.Dispatch<React.SetStateAction<string | null>>] | undefined
>(undefined)

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const state = React.useState<string | null>(null)

  return React.createElement(ThreadContext.Provider, { value: state }, children)
}

export function useThread() {
  const value = React.useContext(ThreadContext)
  if (!value) {
    throw new Error("useThread must be used inside ThreadProvider")
  }
  return value
}
