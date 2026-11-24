// The shared Prettier options live in the repo root. The dashboard adds the
// Tailwind plugin, which sorts class names and is installed only here.
import shared from '../.prettierrc.json' with { type: 'json' };

export default {
  ...shared,
  plugins: ['prettier-plugin-tailwindcss'],
};
