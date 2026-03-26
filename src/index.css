@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

@utility pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

@utility pb-nav-safe {
  padding-bottom: calc(6rem + env(safe-area-inset-bottom));
}

@utility pt-safe {
  padding-top: env(safe-area-inset-top);
}

@utility hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* Disable react-hot-toast default slide animation so our custom fade/scale works cleanly */
.toast-container > div > div {
  animation: none !important;
}

/* Hide number input spin buttons */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
