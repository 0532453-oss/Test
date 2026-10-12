'use client';

import { useEffect, useState } from 'react';

export const ContentContainer = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 809);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        padding: isMobile ? '0px 24px' : '0px 96px',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};
