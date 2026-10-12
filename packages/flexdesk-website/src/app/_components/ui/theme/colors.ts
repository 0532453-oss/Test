export const mainColors = {
  white: '#ffffff',
};

export const secondaryColors = {
  gray60: '#141414',
  gray50: '#474747',
  gray40: '#818181',
  gray30: '#b3b3b3',
  gray20: '#f1f1f1',
  gray10: '#fafafa',
};

export const Color = {
  ...mainColors,
  ...secondaryColors,
};

export const rgba = (hex: string, alpha: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return `rgba(0,0,0,${alpha})`;
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
