"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
         <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
       variant="ghost" 
       size="icon" 
       onClick={() => setTheme(theme === "light" ? "dark" : "light")}
       className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {theme === 'light' ? (
          <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
