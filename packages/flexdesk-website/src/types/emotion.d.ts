import '@emotion/react';

declare module '@emotion/react' {
  export interface Theme {}
}

// Fix for emotion styled components compatibility with React 18
declare module '@emotion/styled' {
  import { CreateStyled } from '@emotion/styled/types/index';
  import { ReactJSX } from 'react/jsx-runtime';
  
  export * from '@emotion/styled/types/index';
}
