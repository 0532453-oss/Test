// @ts-nocheck - Emotion styled components have type compatibility issues with React 18
'use client';

import React from 'react';
import styled from '@emotion/styled';

import { CallToAction } from '@/app/_components/ui/layout/header/callToAction';
import {
  DesktopNav,
  LinkList,
  ListItem,
  LogoContainer,
} from '@/app/_components/ui/layout/header/styled';
import { Logo } from '@/app/_components/ui/layout/Logo';

export const HeaderDesktop = () => {
  return (
    <DesktopNav>
      <LogoContainer>
        <Logo />
      </LogoContainer>
      <LinkList>
        <ListItem href="/story">About</ListItem>
        <ListItem href="/pricing">Pricing</ListItem>
      </LinkList>
      <CallToAction />
    </DesktopNav>
  );
};
