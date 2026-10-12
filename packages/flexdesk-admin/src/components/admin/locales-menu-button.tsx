import { Button } from "@/components/ui/button";
import { useLocales, useLocaleState } from "ra-core";
import { Menu } from "@/components/atlantis";

/**
 * Language switcher button that displays a menu allowing users to select the interface language.
 *
 * Automatically renders in the header when multiple locales are configured in the i18nProvider.
 * User's language selection is persisted using the store.
 * Returns null if only one language is available.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/localesmenubutton LocalesMenuButton documentation}
 * @see {@link https://marmelab.com/ra-core/translationsetup/ i18nProvider setup}
 */
export function LocalesMenuButton() {
  const languages = useLocales();
  const [locale, setLocale] = useLocaleState();

  const getNameForLocale = (localeCode: string): string => {
    const language = languages.find((language) => language.locale === localeCode);
    return language ? language.name : "";
  };

  const changeLocale = (localeCode: string) => (): void => {
    setLocale(localeCode);
  };

  if (languages.length <= 1) {
    return null; // No need to render the dropdown if there's only one language
  }
  return (
    <Menu placement="bottom-end">
      <Menu.Trigger>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          {locale.toUpperCase()}
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        {languages.map((language) => (
          <Menu.Item
            key={language.locale}
            onClick={changeLocale(language.locale)}
            selected={locale === language.locale}
          >
            {getNameForLocale(language.locale)}
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu>
  );
}
