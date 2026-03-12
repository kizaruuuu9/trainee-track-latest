/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1e3a5f',
                    light: '#2563eb',
                    lighter: '#dbeafe',
                },
                accent: '#0ea5e9',
                success: '#16a34a',
                warning: '#d97706',
                danger: '#dc2626',
            }
        },
    },
    plugins: [],
}
