import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import App from './components/App';
import SearchPage from './components/SearchPage';
import SourcePage from './components/SourcePage';
import HowToPage from './components/HowToPage';
import AboutPage from './components/AboutPage';
import EnglishPage from './components/EnglishPage';
import ParsePage from './components/ParsePage';
import theme from './theme';


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    //<React.StrictMode>
        <BrowserRouter>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App>
                    <Routes>
                        <Route exact path='/' element={<Navigate to='/search' replace={true} />}></Route>
                        <Route exact path='/search' element={<SearchPage />}></Route>
                        <Route exact path='/howtouse' element={<HowToPage />}></Route>
                        <Route exact path='/about' element={<AboutPage />}></Route>
                        <Route exact path='/source' element={<SourcePage />}></Route>
                        <Route exact path='/english' element={<EnglishPage />}> </Route>
                        <Route exact path='/parse' element={<ParsePage />}></Route>
                    </Routes>
                    </App>
                </ThemeProvider>
            </StyledEngineProvider>
        </BrowserRouter>
    //</React.StrictMode>
);
