import type { Preview } from '@storybook/react-vite';
import '@_/ui.style';

export const config: Preview = {};

export default config;

// import type { Preview } from '@storybook/react-vite';
//
// // Import Tailwind styles from ui.style package
// import '@_/ui.style';
//
// const preview: Preview = {
//   parameters: {
//     controls: {
//       matchers: {
//         color: /(background|color)$/i,
//         date: /Date$/i,
//       },
//     },
//     // Dark mode support
//     backgrounds: {
//       default: 'light',
//       values: [
//         { name: 'light', value: '#ffffff' },
//         { name: 'dark', value: '#0a0a0a' },
//       ],
//     },
//     a11y: {
//       // 'todo' - show a11y violations in the test UI only
//       // 'error' - fail CI on a11y violations
//       // 'off' - skip a11y checks entirely
//       test: 'todo',
//     },
//   },
//   tags: ['autodocs'],
//   decorators: [
//     (Story, context) => {
//       // Apply dark class based on background selection
//       const isDark = context.globals.backgrounds?.value === '#0a0a0a';
//       return (
//         <div className={isDark ? 'dark' : ''}>
//           <Story />
//         </div>
//       );
//     },
//   ],
// };
//
// export default preview;
