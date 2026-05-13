// src/config/theme.js
export const Colors = {
  primary:      '#0D1B3E',
  primaryLight: '#1A3066',
  accent:       '#F5A623',
  accentLight:  '#FFC85A',

  admin:   '#E63946',
  teacher: '#2A9D8F',
  student: '#4361EE',
  parent:  '#7B2D8B',

  white:    '#FFFFFF',
  offWhite: '#F8F9FD',
  border:   '#E8ECF4',
  inputBg:  '#F0F3FA',

  textDark:   '#0D1B3E',
  textMedium: '#4A5568',
  textLight:  '#8896AB',

  success: '#27AE60',
  warning: '#F5A623',
  error:   '#E63946',
  info:    '#3498DB',
};

export const roleConfig = {
  admin: {
    color:    '#E63946',
    gradient: 'linear-gradient(135deg, #E63946, #C0392B)',
    icon:     '⚙️',
    label:    'Administrator',
    bg:       '#FFF5F5',
  },
  teacher: {
    color:    '#2A9D8F',
    gradient: 'linear-gradient(135deg, #2A9D8F, #1A6B64)',
    icon:     '📚',
    label:    'Teacher',
    bg:       '#F0FAF9',
  },
  student: {
    color:    '#4361EE',
    gradient: 'linear-gradient(135deg, #4361EE, #2541C4)',
    icon:     '🎓',
    label:    'Student',
    bg:       '#F0F3FF',
  },
  parent: {
    color:    '#7B2D8B',
    gradient: 'linear-gradient(135deg, #7B2D8B, #5A1F66)',
    icon:     '👨‍👩‍👧',
    label:    'Parent',
    bg:       '#FDF0FF',
  },
};