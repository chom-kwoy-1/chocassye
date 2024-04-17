import React from 'react';
import './index.css';
import { yale_to_hangul } from './YaleToHangul';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { highlight } from './Highlight';


function showSentence(sentence, highlight_term, i) {
    return (
        <div key={i} className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
            <span className="text">{highlight(sentence.text, false, highlight_term)}</span>
            <span className="pageNum">{sentence.page}</span>
        </div>
    );
}


class SourcePage extends React.Component {
    constructor(props) {
        super(props);
        let name = props.searchParams.get("name");
        let n = props.searchParams.get("n");
        this.state = {
            name: name,
            n: n,
            data: null
        };
    }

    componentDidMount() {
        fetch("/api/source?" + new URLSearchParams({
            name: this.state.name,
            number_in_source: this.state.n
        }))
        .then((res) => res.json())
        .then((result) => {
            console.log(result);
            if (result.status === 'success') {
                this.setState({
                    ...this.state,
                    data: result.data
                });
            }
            else {
                console.log(result);
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    render() {
        if (this.state.data === null) {
            return (
                <div>
                    <h1>{this.state.name}</h1>
                    Loading...
                </div>
            );
        }

        return (
            <div>
                <h1>{this.state.name}</h1>
                {this.state.data.sentences.map(
                    (sentence, i) => showSentence(sentence, this.props.searchParams.get("hl"), i)
                )}
            </div>
        );
    }
}


function withNavigation(Component) {
    return props => <Component {...props}
        navigate={useNavigate()}
        searchParams={useSearchParams()[0]}
        setSearchParams={useSearchParams()[1]}
    />;
}


export default withNavigation(SourcePage);
