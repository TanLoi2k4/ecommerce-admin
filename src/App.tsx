import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { QueryProvider } from './providers/QueryProvider';

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
