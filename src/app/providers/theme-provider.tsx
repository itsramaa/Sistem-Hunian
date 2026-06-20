import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => {},
})

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "sihuni-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }

    return (
      (localStorage.getItem(storageKey) as Theme | null) ??
      defaultTheme
    )
  })

  useEffect(() => {
    const root = document.documentElement

    root.classList.remove("light", "dark")

    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    root.classList.add(resolvedTheme)
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    )

    const handleChange = () => {
      const root = document.documentElement

      root.classList.remove("light", "dark")
      root.classList.add(
        mediaQuery.matches ? "dark" : "light"
      )
    }

    mediaQuery.addEventListener("change", handleChange)

    return () =>
      mediaQuery.removeEventListener(
        "change",
        handleChange
      )
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme)
        setTheme(newTheme)
      },
    }),
    [theme, storageKey]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeProviderContext)
}