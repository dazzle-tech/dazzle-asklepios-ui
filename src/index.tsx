import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/index.less';
import { CustomProvider as RSuiteProvider } from 'rsuite';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useGetSystemConfigQuery } from './services/systemConfigService';

if (typeof window !== 'undefined') {
  const resizeObserverErr = (e: ErrorEvent) => {
    if (
      e.message === 'ResizeObserver loop limit exceeded' ||
      e.message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay');

      if (resizeObserverErrDiv) {
        resizeObserverErrDiv.style.display = 'none';
      }

      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', resizeObserverErr);
}

const setFavicon = (href: string) => {
  document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((el) => {
    el.remove();
  });

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = href.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  link.href = `${href}${href.includes('?') ? '&' : '?'}v=${Date.now()}`;

  document.head.appendChild(link);
};

const RootWrapper = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const { data: systemConfig } = useGetSystemConfigQuery();

  React.useEffect(() => {
    if (systemConfig?.SYSTEM_TITLE) {
      document.title = systemConfig.SYSTEM_TITLE;
    }

    if (systemConfig?.PRIMARY_COLOR) {
      document.documentElement.style.setProperty('--primary-color', systemConfig.PRIMARY_COLOR);
      document.documentElement.style.setProperty('--primary-blue', systemConfig.PRIMARY_COLOR);
    }

    if (systemConfig?.FONT_FAMILY) {
      document.documentElement.style.setProperty('--font-family', systemConfig.FONT_FAMILY);
    }

    if (systemConfig?.FAVICON) {
      setFavicon(systemConfig.FAVICON);
    }
  }, [systemConfig]);

  const primaryColor = systemConfig?.PRIMARY_COLOR || '#1976d2';
  const fontFamily = systemConfig?.FONT_FAMILY || 'Inter';
  const logo = systemConfig?.SYSTEM_LOGO || '/clinicle.png';

  const muiTheme = createTheme({
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light',
      primary: {
        main: primaryColor
      }
    },
    typography: {
      fontFamily
    }
  });

  const styledTheme = {
    mode,
    systemConfig,
    logo,
    colors: {
      primary: primaryColor,
      background: mode === 'dark' ? '#121212' : '#fff',
      text: mode === 'dark' ? '#fff' : '#000'
    }
  };

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      <RSuiteProvider theme={mode === 'dark' ? 'dark' : 'light'}>
        <StyledThemeProvider theme={styledTheme}>
          <div className={mode === 'light' ? 'light' : 'dark'}>
            <App />
          </div>
        </StyledThemeProvider>
      </RSuiteProvider>
    </MUIThemeProvider>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <Provider store={store}>
      <HashRouter>
        <RootWrapper />
      </HashRouter>
    </Provider>
  );
}