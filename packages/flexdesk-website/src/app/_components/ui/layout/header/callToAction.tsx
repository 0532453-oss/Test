import {
  CallToActionContainer,
  LinkNextToCTA,
  StyledButton,
} from '@/app/_components/ui/layout/header/styled';

export const CallToAction = () => {
  return (
    <CallToActionContainer>
      <LinkNextToCTA href="/pricing">Pricing</LinkNextToCTA>
      <LinkNextToCTA href="/signin">Sign in</LinkNextToCTA>
      <a href="/signin">
        <StyledButton>Get Started</StyledButton>
      </a>
    </CallToActionContainer>
  );
};
