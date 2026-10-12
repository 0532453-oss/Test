export const startsWithAny = (
  pathname: string,
  prefixes: string[],
): boolean => {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
};

export const isSectionPath = (pathname: string | undefined): boolean => {
  if (!pathname) return false;
  return startsWithAny(pathname, [
    '/developers/section',
    '/user-guide/section',
  ]);
};

export const isDocsSection = (pathname: string | undefined): boolean => {
  return isSectionPath(pathname) && pathname?.split('/').length === 4;
};

export const isPlaygroundPage = (pathname: string | undefined): boolean => {
  if (!pathname) return false;
  return startsWithAny(pathname, [
    '/developers/rest-api',
    '/developers/graphql',
  ]);
};

export const shouldShowEmptySidebar = (
  pathname: string | undefined,
): boolean => {
  if (!pathname) return false;
  return (
    ['/user-guide', '/developers'].includes(pathname) ||
    isDocsSection(pathname) ||
    isPlaygroundPage(pathname)
  );
};

export const getUriAndLabel = (pathname: string) => {
  if (pathname.includes('user-guide')) {
    return { uri: '/user-guide', label: 'User Guide' };
  }
  return { uri: '/developers', label: 'Developers' };
};
