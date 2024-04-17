import React from 'react';

class App extends React.Component {
    render() {
        return (
            <div>
                <header>
                    ᄎᆞ자쎠
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
