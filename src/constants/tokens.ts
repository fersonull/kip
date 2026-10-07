export const C = {
  bg: '#F7F3EE',
  ink: '#2A2420',
  ember: '#D9774A',
  peach: '#F4B58F',
  rust: '#A44E24',
  sand: '#F1E4D8',
  line: '#E9DFD4',
  card: '#FFFFFF',
  sheet: '#FBF8F4',
  muted: '#5E544C',
  faint: '#8F837A',
  disabled: '#7D7168',
  handle: '#CFC3B7',
  danger: '#B5443F',
  dangerLine: '#C9504A',
  dangerBg: '#F7DEDA',
  ok: '#5FA36A',
  okInk: '#3F7F49',
  okBg: '#E3EEE2',
} as const;

const TINTS = ['#F1E4D8', '#E3E9D9', '#F4DCCB', '#E7DFEF', '#DCE7E6', '#F3E3C6'];

export const tintFor = (title: string) => TINTS[(title.charCodeAt(0) + title.length) % TINTS.length];

export const F = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_600SemiBold',
} as const;
