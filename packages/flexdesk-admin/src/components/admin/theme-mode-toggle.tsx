import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/admin/theme-provider";
import { Menu } from "@/components/atlantis";

/**
 * Toggle button that lets users switch between light, dark, and system UI themes.
 *
 * User's selection is persisted using the store.
 * Automatically included in the default Layout component header.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/thememodetoggle ThemeModeToggle documentation}
 */
export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Menu placement="bottom-end">
      <Menu.Trigger>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => setTheme("light")} selected={theme === "light"}>
          Light
        </Menu.Item>
        <Menu.Item onClick={() => setTheme("dark")} selected={theme === "dark"}>
          Dark
        </Menu.Item>
        <Menu.Item onClick={() => setTheme("system")} selected={theme === "system"}>
          System
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
