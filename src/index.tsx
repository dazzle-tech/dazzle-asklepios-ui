import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter} from 'react-router-dom';
import { BrowserRouter} from 'react-router-dom';
import App from './App';
import { store } from './store';

import './styles/index.less';
import "primereact/resources/themes/lara-light-cyan/theme.css";

import { PrimeReactProvider } from 'primereact/api';
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    {/* <BrowserRouter> */}
    <HashRouter>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </HashRouter>
        {/* </BrowserRouter> */}
  </Provider>
);
