// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { Provider } from 'react-redux';
// import { HashRouter} from 'react-router-dom';
// import { BrowserRouter} from 'react-router-dom';
// import App from './App';
// import { store } from './store';
// import { createTheme, ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import './styles/index.less';
// import "primereact/resources/themes/lara-light-cyan/theme.css";
// import { CustomProvider } from 'rsuite';
// import { PrimeReactProvider } from 'primereact/api';
// import { useSelector } from 'react-redux';
// import { useAppDispatch } from '@/hooks';
// import { setMode } from '@/reducers/uiSlice';

// // const mode = useSelector(state => state.ui.mode);
// // const darkTheme = createTheme({
// //   palette: {
// //     mode: 'dark',
// //   },
// // });
// // const lightTheme = createTheme({
// //   palette: {
// //     mode: 'light',
// //   },
// // });
// const RootWrapper = () => {
//   const mode = useSelector((state: any) => state.ui.mode); // استخدم الـ type المناسب إذا تستخدم TS

//   const theme = createTheme({
//     palette: {
//       mode: mode === 'dark' ? 'dark' : 'light',
//     },
//   });

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <CustomProvider theme={mode === 'dark' ? 'dark' : 'light'}>
//         <PrimeReactProvider>
//           <App />
//         </PrimeReactProvider>
//       </CustomProvider>
//     </ThemeProvider>
//   );
// };
// const root = ReactDOM.createRoot(document.getElementById('root')!);
// root.render(
//   <Provider store={store}>
//     <HashRouter>
//       <RootWrapper />
//     </HashRouter>
//   </Provider>
// );


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
import { PrimeReactProvider, PrimeReact } from 'primereact/api';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

// استدعاء جميع themes الممكنة من PrimeReact

// تعريف themes لكل مكتبة
const RootWrapper = () => {
  const mode = useSelector((state: any) => state.ui.mode); // 'light' أو 'dark'

  // MUI theme
  const muiTheme = createTheme({
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light',
    },
  });

  

  // Styled Components theme
  const styledTheme = {
    mode,
    colors: {
      background: mode === 'dark' ? '#121212' : '#fff',
      text: mode === 'dark' ? '#fff' : '#000',
    },
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

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <HashRouter>
      <RootWrapper />
    </HashRouter>
  </Provider>
);
