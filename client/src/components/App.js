import React from 'react';

class App extends React.Component {
    render() {
        return (
            <div>
                <header>
                    Header
                </header>

                <main>
                    {this.props.children}
                </main>

                <footer>
                    Footer
                </footer>
            </div>
        );
    }
}

export default App;
