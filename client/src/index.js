import ReactDOM from 'react-dom';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

import App from './components/App';
import EomiPage from './components/EomiPage';
import SearchPage from './components/SearchPage';


ReactDOM.render((
  <BrowserRouter>
    <App>
    <Routes>
        <Route exact path='/' element={<EomiPage index={1} />}></Route>
        <Route exact path='/search' element={<SearchPage />}></Route>
    </Routes>
    </App>
  </BrowserRouter>
  ), document.getElementById('root')
);
