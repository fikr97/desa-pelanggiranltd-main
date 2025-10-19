import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light"

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function PublicThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("dark") // Hanya hapus kelas dark karena kita hanya gunakan light
    root.classList.add("light")
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (newTheme === "light") {
        setTheme(newTheme)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a PublicThemeProvider")

  return context
}