import React from 'react';
import './index.css';
import { yale_to_hangul } from './YaleToHangul';
import { Link, useNavigate, useSearchParams } from "react-router-dom"


function showSentence(sentence, i) {
    if (sentence.mark === null) {
        return (
            <div key={i} className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
                <span className="text">{yale_to_hangul(sentence.sentence)}</span>
                <span className="pageNum">{sentence.page}</span>
            </div>
        );
    }
    else {
        return (
            <div key={i} className="sourceMark">
                <span>{sentence.mark}</span>
            </div>
        );
    }
}


class SourcePage extends React.Component {
    constructor(props) {
        super(props);
        let name = props.searchParams.get("name");
        let n = props.searchParams.get("n");
        this.state = {
            name: name,
            n: n,
            sentences: []
        };
    }

    componentDidMount() {
        fetch("/api/source?" + new URLSearchParams({
            name: this.state.name,
            number_in_source: this.state.n
        }))
        .then(res => res.json())
        .then((result) => {
            if (result.status === 'success') {
                this.setState({
                    ...this.state,
                    sentences: result.sentences
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
        return (
            <div>
                <h1>{this.state.name}</h1>
                {this.state.sentences.map((sentence, i) => showSentence(sentence, i))}
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
