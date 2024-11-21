import React from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import App from './components/App';
import SearchPage from './components/SearchPage';
import SourceListPage from './components/SourceListPage';
import SourcePage from './components/SourcePage';
import HowToPage from './components/HowToPage';
import AboutPage from './components/AboutPage';
import EnglishPage from './components/EnglishPage';
import ParsePage from './components/ParsePage';
import {ThemeContext} from "./components/ThemeContext";
import {lightTheme, darkTheme} from './themes';
import {useMediaQuery} from "@mui/material";


function AppWrapper(props) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)',{ noSsr: true });
    let [curTheme, setCurTheme] = React.useState(prefersDarkMode? darkTheme : lightTheme);
    return (
        <BrowserRouter>
            <ThemeContext.Provider value={[ curTheme, setCurTheme ]}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={curTheme}>
                        <CssBaseline />
                        <App>
                            <Routes>
                                <Route exact path='/' element={<Navigate to='/search' replace={true} />}></Route>
                                <Route exact path='/search' element={<SearchPage />}></Route>
                                <Route exact path='/sourcelist' element={<SourceListPage />}></Route>
                                <Route exact path='/howtouse' element={<HowToPage />}></Route>
                                <Route exact path='/about' element={<AboutPage />}></Route>
                                <Route exact path='/source' element={<SourcePage />}></Route>
                                <Route exact path='/english' element={<EnglishPage />}> </Route>
                                <Route exact path='/parse' element={<ParsePage />}></Route>
                            </Routes>
                        </App>
                    </ThemeProvider>
                </StyledEngineProvider>
            </ThemeContext.Provider>
        </BrowserRouter>
    );
}

ReactDOM.render((
    <React.StrictMode>
        <AppWrapper />
    </React.StrictMode>
  ), document.getElementById('root')
);
