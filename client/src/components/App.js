import React from 'react';
import { Link } from "react-router-dom";
import './i18n';
import { withTranslation } from 'react-i18next';


class App extends React.Component {
    render() {
        return (
            <div>
                <header>
                    <a href="/">{this.props.t('Chocassye')}</a>
                </header>

                <main>
                    {this.props.children}
                </main>

                <main className='bottom'>
                    <Link to="/search" className="sitelink">{this.props.t('Search')}</Link>
                    <Link to="/howtouse" className="sitelink">{this.props.t('How to Use')}</Link>
                    <Link to="/about" className="sitelink">{this.props.t('About')}</Link>
                </main>

                <footer>
                    {this.props.t('Search Engine')}
                </footer>
            </div>
        );
    }
}

export default withTranslation()(App);
