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

// Only in development; avoid in production if you can.
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

  // MUI theme
  const muiTheme = createTheme({
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light'
    }
  });

  // Styled Components theme
  const styledTheme = {
    mode,
    colors: {
      background: mode === 'dark' ? '#121212' : '#fff',
      text: mode === 'dark' ? '#fff' : '#000'
    }
  };

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      <RSuiteProvider theme={mode === 'dark' ? 'dark' : 'light'}>
        <StyledThemeProvider theme={styledTheme}>
          <div className={`${mode === 'light' ? 'light' : 'dark'}`}>
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
      <HashRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <RootWrapper />
      </HashRouter>
    </Provider>
  );
}