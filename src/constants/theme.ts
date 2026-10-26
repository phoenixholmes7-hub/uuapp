import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11151C',
    textSecondary: '#5B6472',
    background: '#F4F5F8',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEEF2',
    border: '#E1E4EA',
    primary: '#1D3B6E',
    primaryText: '#FFFFFF',
    accent: '#B4232A',
    success: '#1E8A4C',
    warning: '#B26B00',
    tint: '#E7ECF5',
  },
  dark: {
    text: '#F2F4F8',
    textSecondary: '#A0A8B6',
    background: '#0C0F14',
    surface: '#161A21',
    surfaceMuted: '#1F242D',
    border: '#272D37',
    primary: '#8CB0EE',
    primaryText: '#0C0F14',
    accent: '#F06A70',
    success: '#4CC985',
    warning: '#F0B04A',
    tint: '#1B2639',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: { rounded: 'ui-rounded' },
  web: { rounded: 'ui-rounded, system-ui, sans-serif' },
  default: { rounded: undefined },
});

export const MaxContentWidth = 720;
