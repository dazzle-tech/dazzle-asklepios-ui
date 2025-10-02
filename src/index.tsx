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
            <Provider store={store}>
              <App />
            </Provider>
          </div>
        </StyledThemeProvider>
      </RSuiteProvider>
    </MUIThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <HashRouter>
      <RootWrapper />
    </HashRouter>
  </Provider>
);
