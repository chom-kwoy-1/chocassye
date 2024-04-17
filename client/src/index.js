import React from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

import App from './components/App';
import EomiPage from './components/EomiPage';
import SearchPage from './components/SearchPage';
import SourcePage from './components/SourcePage';


ReactDOM.render((
    <React.StrictMode>
        <BrowserRouter>
            <App>
            <Routes>
                <Route exact path='/dict' element={<EomiPage index={1} />}></Route>
                <Route exact path='/search' element={<SearchPage />}></Route>
                <Route exact path='/source' element={<SourcePage />}></Route>
            </Routes>
            </App>
        </BrowserRouter>
    </React.StrictMode>
  ), document.getElementById('root')
);
