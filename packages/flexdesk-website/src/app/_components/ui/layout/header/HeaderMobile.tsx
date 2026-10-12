'use client';

import { useState } from 'react';

import { CallToAction } from '@/app/_components/ui/layout/header/callToAction';
import {
  HamburgerContainer,
  HamburgerLine1,
  HamburgerLine2,
  ListItem,
  LogoContainer,
  MobileLinkList,
  MobileMenu,
  MobileNav,
  NavOpen,
} from '@/app/_components/ui/layout/header/styled';
import { Logo } from '@/app/_components/ui/layout/Logo';

export const HeaderMobile = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <MobileMenu>
      <MobileNav>
        <LogoContainer>
          <Logo />
        </LogoContainer>
        <HamburgerContainer>
          <input type="checkbox" id="menu-input" onChange={toggleMenu} />
          <HamburgerLine1 id="line1" />
          <HamburgerLine2 id="line2" />
        </HamburgerContainer>
      </MobileNav>
      <NavOpen
        style={{
          transform: `scaleY(${menuOpen ? '1' : '0'})`,
        }}
      >
        <MobileLinkList>
          <ListItem href="/story">About</ListItem>
          <ListItem href="/pricing">Pricing</ListItem>
          <ListItem href="/signin">Sign in</ListItem>
        </MobileLinkList>
        <CallToAction />
      </NavOpen>
    </MobileMenu>
  );
};
