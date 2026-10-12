import { Children, useCallback, useState } from "react";
import {
  Translate,
  useAuthProvider,
  useGetIdentity,
  useLogout,
  UserMenuContext,
} from "ra-core";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/atlantis";
import { Menu, Text } from "@/components/atlantis";

export type UserMenuProps = {
  children?: React.ReactNode;
};

/**
 * A user menu component displayed in the top right corner of the admin layout.
 *
 * Provides access to user-related actions such as profile, settings, and logout.
 * Displays the user's avatar and name from the identity provider, and includes a logout option.
 * Only displays in applications using authentication.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/usermenu UserMenu documentation}
 */
export function UserMenu({ children }: UserMenuProps) {
  const authProvider = useAuthProvider();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();

  const [open, setOpen] = useState(false);

  const handleToggleOpen = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  if (!authProvider) return null;

  return (
    <UserMenuContext.Provider value={{ onClose: handleClose }}>
      <Menu open={open} onOpenChange={handleToggleOpen} placement="bottom-end">
        <Menu.Trigger>
          <Button
            variant="ghost"
            className="relative h-8 w-8 ml-2 rounded-full"
          >
            <Avatar
              imageUrl={identity?.avatar}
              initials={identity?.fullName?.charAt(0) || '?'}
              name={identity?.fullName}
              size="base"
            />
          </Button>
        </Menu.Trigger>
        <Menu.Content width={224}>
          <Menu.Header>
            <Text className="font-medium">{identity?.fullName}</Text>
          </Menu.Header>
          <Menu.Separator />
          {children}
          {Children.count(children) > 0 && <Menu.Separator />}
          <Menu.Item icon="logout" onClick={() => logout()}>
            <Translate i18nKey="ra.auth.logout">Log out</Translate>
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </UserMenuContext.Provider>
  );
}
