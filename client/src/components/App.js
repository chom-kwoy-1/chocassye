import React from 'react';

class App extends React.Component {
    render() {
        return (
            <div>
                <header>
                    <a href="/search">ᄎᆞ자쎠</a>
                </header>

                <main>
                    {this.props.children}
                </main>

                <footer>
                    Search Engine
                </footer>
            </div>
        );
    }
}

export default App;
