import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/index.less';
import { Loader, CustomProvider as RSuiteProvider } from 'rsuite';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useLazyGetSystemConfigQuery } from './services/systemConfigService';
import { lightenColor } from './utils';

const DEFAULT_SYSTEM_CONFIG = {
  SYSTEM_TITLE: 'Asklepios',
  PRIMARY_COLOR: '#1976d2',
  FONT_FAMILY: 'Inter',
  SYSTEM_LOGO: '/clinicle.png',
  SIDEBAR_LOGO: '/clinicle.png',
  SIDEBAR_LOGO_DARK: '/clinicle.png',
  LOGIN_BACKGROUND: '/clinicle.png',
  FAVICON: '/favicon.ico'
};

const isValidSystemConfig = (config: any) => {
  return config && typeof config === 'object' && Object.keys(config).length > 0;
};

const mergeWithDefaultConfig = (config?: any) => {
  return {
    ...DEFAULT_SYSTEM_CONFIG,
    ...(isValidSystemConfig(config) ? config : {})
  };
};

const getCachedSystemConfig = () => {
  try {
    const cached = localStorage.getItem('systemConfig');

    if (!cached) return null;

    const parsed = JSON.parse(cached);

    if (!isValidSystemConfig(parsed)) {
      localStorage.removeItem('systemConfig');
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem('systemConfig');
    return null;
  }
};

const hexToRgb = (hex?: string) => {
  const fallback = '25, 118, 210';

  if (!hex || typeof hex !== 'string') return fallback;

  const cleanHex = hex.replace('#', '');

  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return fallback;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};

const safeLightenColor = (color: string) => {
  try {
    return lightenColor(color, 0.9);
  } catch {
    return '#e8f1ff';
  }
};

const setFavicon = (href?: string) => {
  if (!href) return;

  try {
    document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach(el => {
      el.remove();
    });

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = href.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    link.href = href;

    document.head.appendChild(link);
  } catch {
    // ignore
  }
};

const applySystemConfig = (config: any) => {
  const safeConfig = mergeWithDefaultConfig(config);
  const primaryRgb = hexToRgb(safeConfig.PRIMARY_COLOR);

  document.title = safeConfig.SYSTEM_TITLE;

  document.documentElement.style.setProperty('--primary-color', safeConfig.PRIMARY_COLOR);
  document.documentElement.style.setProperty('--primary-blue', safeConfig.PRIMARY_COLOR);
  document.documentElement.style.setProperty('--primary-blue-rgb', primaryRgb);
  document.documentElement.style.setProperty('--one-health-theme-hover', `rgba(${primaryRgb}, 0.05)`);
  document.documentElement.style.setProperty('--one-health-theme-header', safeLightenColor(safeConfig.PRIMARY_COLOR));
  document.documentElement.style.setProperty('--one-health-theme-select', `rgba(${primaryRgb}, 0.12)`);
  document.documentElement.style.setProperty('--font-family', safeConfig.FONT_FAMILY);

  setFavicon(safeConfig.FAVICON);
};

const initialCachedConfig = getCachedSystemConfig();
const initialSystemConfig = mergeWithDefaultConfig(initialCachedConfig);

applySystemConfig(initialSystemConfig);

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

const RootWrapper = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [getSystemConfig] = useLazyGetSystemConfigQuery();

  const hasRequestedConfig = useRef(false);

  const [activeConfig, setActiveConfig] = useState(() => initialSystemConfig);
  const [isInitialLoading, setIsInitialLoading] = useState(!isValidSystemConfig(initialCachedConfig));

  useEffect(() => {
    if (hasRequestedConfig.current) return;

    hasRequestedConfig.current = true;

    getSystemConfig(undefined, false)
      .unwrap()
      .then(config => {
        if (!isValidSystemConfig(config)) return;

        const mergedConfig = mergeWithDefaultConfig(config);

        localStorage.setItem('systemConfig', JSON.stringify(config));
        applySystemConfig(mergedConfig);
        setActiveConfig(mergedConfig);
      })
      .catch(() => {
        setActiveConfig(initialSystemConfig);
        applySystemConfig(initialSystemConfig);
      })
      .finally(() => {
        setIsInitialLoading(false);
      });
  }, [getSystemConfig]);

  const primaryColor = activeConfig.PRIMARY_COLOR;
  const fontFamily = activeConfig.FONT_FAMILY;
  const logo = activeConfig.SYSTEM_LOGO;
  const loginBackground = activeConfig.LOGIN_BACKGROUND;
  const sidebarLogo = activeConfig.SIDEBAR_LOGO || logo;
  const sidebarLogoDark = activeConfig.SIDEBAR_LOGO_DARK || sidebarLogo;

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode === 'dark' ? 'dark' : 'light',
          primary: {
            main: primaryColor
          }
        },
        typography: {
          fontFamily
        }
      }),
    [mode, primaryColor, fontFamily]
  );

  const styledTheme = useMemo(
    () => ({
      mode,
      systemConfig: activeConfig,
      logo,
      loginBackground,
      sidebarLogo,
      sidebarLogoDark,
      colors: {
        primary: primaryColor,
        background: mode === 'dark' ? '#121212' : '#fff',
        text: mode === 'dark' ? '#000' : '#000'
      }
    }),
    [mode, activeConfig, logo, loginBackground, sidebarLogo, sidebarLogoDark, primaryColor]
  );

  if (isInitialLoading) {
    return (
      <div className="app-initial-loader">
        <Loader />
      </div>
    );
  }

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