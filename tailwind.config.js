module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#D71920',
        'brand-dark': '#A90F18',
        mist: '#F5F5F5',
        muted: '#777777',
        ink: '#222222',
      },
      fontFamily: { sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
