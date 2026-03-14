import { useState, useEffect } from 'react';

export function useDarkMode() {
    const [isDark, setIsDark] = useState(() => {
        try {
            const item = window.localStorage.getItem('truedegree_theme');
            return item ? item === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (error) {
            return false;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('truedegree_theme', isDark ? 'dark' : 'light');
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (error) {
            console.error('Failed to set theme setting', error);
        }
    }, [isDark]);

    const toggleDark = () => setIsDark(!isDark);

    return { isDark, toggleDark };
}
