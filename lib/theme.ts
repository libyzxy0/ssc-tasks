import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
 
export const THEME = {
  light: {
    background: 'hsl(210 20% 98%)',
    foreground: 'hsl(215 25% 10%)',

    card: 'hsl(210 20% 100%)',
    cardForeground: 'hsl(215 25% 10%)',

    popover: 'hsl(210 20% 100%)',
    popoverForeground: 'hsl(215 25% 10%)',

    primary: 'hsl(220 65% 55%)',              // blue
    primaryForeground: 'hsl(0 0% 100%)',

    secondary: 'hsl(210 20% 95%)',
    secondaryForeground: 'hsl(215 25% 15%)',

    muted: 'hsl(210 20% 94%)',
    mutedForeground: 'hsl(215 15% 45%)',

    accent: 'hsl(210 25% 92%)',
    accentForeground: 'hsl(215 25% 15%)',

    destructive: 'hsl(0 72% 55%)',

    border: 'hsl(210 15% 88%)',
    input: 'hsl(210 15% 88%)',
    ring: 'hsl(220 80% 60%)',                // blue ring

    radius: '0.625rem',

    chart1: 'hsl(215 70% 55%)',               // bright blue
    chart2: 'hsl(200 65% 45%)',
    chart3: 'hsl(190 55% 40%)',
    chart4: 'hsl(230 60% 60%)',
    chart5: 'hsl(240 55% 65%)',
  },

  dark: {
    background: 'hsl(220 15% 10%)',
    foreground: 'hsl(210 20% 98%)',

    card: 'hsl(220 15% 12%)',
    cardForeground: 'hsl(210 20% 98%)',

    popover: 'hsl(220 15% 12%)',
    popoverForeground: 'hsl(210 20% 98%)',

    primary: 'hsl(220 70% 60%)',             
    primaryForeground: 'hsl(215 25% 10%)',

    secondary: 'hsl(220 15% 18%)',
    secondaryForeground: 'hsl(210 20% 98%)',

    muted: 'hsl(220 15% 20%)',
    mutedForeground: 'hsl(215 15% 65%)',

    accent: 'hsl(220 15% 18%)',
    accentForeground: 'hsl(210 20% 98%)',

    destructive: 'hsl(0 72% 60%)',

    border: 'hsl(220 15% 20%)',
    input: 'hsl(220 15% 20%)',
    ring: 'hsl(220 80% 65%)',

    radius: '0.625rem',

    chart1: 'hsl(215 75% 65%)',
    chart2: 'hsl(200 70% 55%)',
    chart3: 'hsl(190 60% 50%)',
    chart4: 'hsl(230 65% 70%)',
    chart5: 'hsl(240 60% 75%)',
  },
};
 
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};