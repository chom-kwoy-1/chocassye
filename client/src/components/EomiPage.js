import React from 'react';
import './index.css';
import { yale_to_hangul } from './YaleToHangul';


class AddDefinition extends React.Component {
    render() {
        return (
            <div className="add_definition">
                <div className="add_definition_inside">
                    <button onClick={() => this.props.onAdd()}>
                        + Add definition
                    </button>
                </div>
            </div>
        );
    }
}

class Definition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            desc: props.definition.desc,
            isEditing: false
        }
    }

    handleEdit() {
        this.setState({
            desc: this.state.desc,
            isEditing: true
        })
    }

    handleTextChange(event) {
        this.setState({
            desc: event.target.value,
            isEditing: true
        })
    }

    cancel() {
        this.setState({
            desc: this.state.desc,
            isEditing: false
        });
    }

    submit() {
        this.setState({
            desc: this.state.desc,
            isEditing: false
        });
        this.props.updateDefinition(this.state.desc);
    }

    render() {
        if (this.state.isEditing) {
            return (
                <div className="definition editing">
                    <h2>Definition {this.props.index + 1}</h2>
                    <textarea value={this.state.desc} onChange={(event) => this.handleTextChange(event)} />
                    <button onClick={() => this.submit()}>Submit</button>
                    <button onClick={() => this.cancel()}>Cancel</button>
                </div>
            );
        } else {
            return (
                <div className="definition">
                    <h2>Definition {this.props.index + 1}</h2>
                    <span>{this.props.definition.desc}</span>
                    <button className="edit_button" onClick={() => this.handleEdit()}>Edit</button>
                    <button className="remove_button" onClick={() => this.props.onRemove()}>Remove</button>
                </div>
            );
        }
    }
}


async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(data)
    });
    return response.json();
}


class EomiPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            lemma: "",
            definitions: []
        };
    }

    componentDidMount() {
        fetch("/api/lemma?" + new URLSearchParams({
            id: this.props.index
        }))
        .then(res => res.json())
        .then((result) => {
            if (result.status === "success") {
                this.setState({
                    error: null,
                    isLoaded: true,
                    lemma: result.name,
                    definitions: result.definitions
                });
            }
            else {
                this.setState({
                    error: result.msg,
                    isLoaded: false,
                });
            }
        })
        .catch((error) => {
            console.log(error);
            this.setState({
                error: error.message,
                isLoaded: false,
            });
        });
    }

    addDefinition(i) {
        let definitions = this.state.definitions.slice();
        if (i === 'end') {
            i = definitions.length;
        }

        postData("/api/add_def", {
            lemma_id: this.props.index,
            position: i
        })
        .then((result) => {
            if (result.status === "success") {
                definitions.splice(i, 0, {
                    id: result.id,
                    desc: ""
                });

                this.setState({
                    error: null,
                    isLoaded: true,
                    lemma: this.state.lemma,
                    definitions: definitions
                });
            }
            else {
                // TODO handle error
                console.log(result.msg);
            }
        })
        .catch((error) => {
            // TODO handle error
            console.log(error);
        });
    }

    updateDefinition(i, update) {
        let definitions = this.state.definitions.slice();

        postData("/api/update_def", {
            def_id: definitions[i].id,
            desc: update
        })
        .then((result) => {
            console.log(result);

            let definitions = this.state.definitions.slice();
            definitions[i].desc = update;

            this.setState({
                error: null,
                isLoaded: true,
                lemma: this.state.lemma,
                definitions: definitions
            });
        })
        .catch((error) => {
            console.log(error);
        });
    }

    removeDefinition(i) {
        let definitions = this.state.definitions.slice();

        postData("/api/remove_def", {
            def_id: definitions[i].id
        })
        .then((result) => {
            console.log(result);

            let definitions = this.state.definitions.slice();
            definitions.splice(i, 1);

            this.setState({
                error: null,
                isLoaded: true,
                lemma: this.state.lemma,
                definitions: definitions
            });
        })
        .catch((error) => {
            console.log(error);
        });
    }

    render() {
        return (
            <div className="lemma">
                <h1><span className="yale">{this.state.lemma}</span> <span className="hangul">{yale_to_hangul(this.state.lemma)}</span></h1>
                <hr/>
                {this.state.definitions.map((definition, i) => (
                    <div key={i}>
                        <AddDefinition onAdd={() => this.addDefinition(i)} />
                        <Definition index={i}
                            definition={definition}
                            updateDefinition={(update) => this.updateDefinition(i, update)}
                            onRemove={() => this.removeDefinition(i)}
                        />
                    </div>
                ))}
                <AddDefinition onAdd={() => this.addDefinition('end')} />
            </div>
        );
    }
}

export default EomiPage;
