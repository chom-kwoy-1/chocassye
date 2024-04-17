import React from 'react';
import './index.css';
import yale_to_hangul from './YaleToHangul';


class SearchPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: ""
        };
    }

    handleChange(event) {
        this.setState({
            searchTerm: event.target.value
        });
    }

    render() {
        return (
            <div>
                <input
                    type="text"
                    value={this.state.searchTerm}
                    onChange={(event) => this.handleChange(event)}
                />
                <div className="preview">{yale_to_hangul(this.state.searchTerm)}</div>
            </div>
        );
    }
}

export default SearchPage;
