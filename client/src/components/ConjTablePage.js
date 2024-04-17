import React from 'react';
import './index.css';

class Feature {
    constructor(code, name, values) {
        this.code = code;
        this.name = name;
        this.values = values;
        this.selectedIndex = 0;
    }

    select(idx) {
        let copy = new Feature(this.code, this.name, this.values);
        copy.selectedIndex = idx;
        return copy;
    }

    selected() {
        return this.values[this.selectedIndex];
    }
}

class FeatureList extends React.Component {
    constructor(props) {
        super(props);
        this.variableElements = {};
        this.fixedElements = {};
        this.dragIndex = null;
        this.dragTo = null;
    }

    removeAllGapLines() {
        // Remove all gap lines
        for (const idx in this.variableElements) {
            let dom = this.variableElements[idx];
            dom.className = "featureFrame";
        }
        for (const idx in this.fixedElements) {
            let dom = this.fixedElements[idx];
            dom.className = "featureFrame";
        }
    }

    dragStart(listName, i) {
        this.dragIndex = {listName: listName, index: i};
    }

    dragEnd() {
        this.removeAllGapLines();

        if (this.dragIndex !== null && this.dragTo !== null) {
            let variableFeatures = this.props.variableFeatures.slice(0);
            let fixedFeatures = this.props.fixedFeatures.slice(0);

            let dragFromList = null;
            if (this.dragIndex.listName == 'variable') {
                dragFromList = variableFeatures;
            }
            else if (this.dragIndex.listName == 'fixed') {
                dragFromList = fixedFeatures;
            }

            let dragToList = null;
            if (this.dragTo.listName == 'variable') {
                dragToList = variableFeatures;
            }
            else if (this.dragTo.listName == 'fixed') {
                dragToList = fixedFeatures;
            }

            let feat = dragFromList[this.dragIndex.index];
            dragFromList.splice(this.dragIndex.index, 1);
            dragToList.splice(this.dragTo.index, 0, feat);

            this.props.setFeatures(variableFeatures, fixedFeatures);
        }

        this.dragIndex = null;
    }

    dragOver(event) {
        event.preventDefault();

        this.removeAllGapLines();

        let closest_gap_list = null;
        let closest_gap_idx = null;
        let min_dist = 1e9;

        let update = (list_name, length, elements, idx) => {
            idx = parseInt(idx);
            let dom = elements[idx];
            let rect = dom.getBoundingClientRect();
            let beforeDist = Math.abs(rect.top - event.clientY);
            let afterDist = Math.abs(rect.bottom - event.clientY);

            if (beforeDist < min_dist) {
                min_dist = beforeDist;
                closest_gap_idx = idx;
                closest_gap_idx = Math.min(closest_gap_idx, length);
                closest_gap_list = list_name;
            }

            if (afterDist < min_dist) {
                min_dist = afterDist;
                closest_gap_idx = idx + 1;
                closest_gap_idx = Math.min(closest_gap_idx, length);
                closest_gap_list = list_name;
            }
        };

        // Find nearest gap
        for (let idx in this.variableElements) {
            update('variable', this.props.variableFeatures.length, this.variableElements, idx);
        }
        for (let idx in this.fixedElements) {
            update('fixed', this.props.fixedFeatures.length, this.fixedElements, idx);
        }

        // Show line on the gap
        if (closest_gap_list == 'variable') {
            this.variableElements[closest_gap_idx].className = "featureFrameTop";
        }
        else if (closest_gap_list == 'fixed') {
            this.fixedElements[closest_gap_idx].className = "featureFrameTop";
        }

        let dragToIndex = closest_gap_idx;
        if (this.dragIndex.listName === closest_gap_list) {
            dragToIndex = (dragToIndex <= this.dragIndex.index)? closest_gap_idx : closest_gap_idx - 1
        }

        this.dragTo = {listName: closest_gap_list, index: dragToIndex};
    }

    render() {
        return (
            <div onDragOver={(event) => this.dragOver(event)}>
                Variable features
                <div className="featureContainer">
                    {this.props.variableFeatures.map((feature, i) => (
                        <div key={i} ref={(ref) => this.variableElements[i] = ref} className="featureFrame">
                            <div className="featureDraggable" draggable="true"
                             onDragStart={() => this.dragStart('variable', i)}
                             onDragEnd={() => this.dragEnd()}>
                                {feature.name}
                            </div>
                        </div>
                    ))}
                    <div ref={(ref) => this.variableElements[this.props.variableFeatures.length] = ref} className="featureFrame">
                    </div>
                </div>
                Fixed features
                <div className="featureContainer">
                    {this.props.fixedFeatures.map((feature, i) => (
                        <div key={i} ref={(ref) => this.fixedElements[i] = ref} className="featureFrame">
                            <div className="featureDraggable" draggable="true"
                             onDragStart={() => this.dragStart('fixed', i)}
                             onDragEnd={() => this.dragEnd()}>
                                {feature.name}
                            </div>
                        </div>
                    ))}
                    <div ref={(ref) => this.fixedElements[this.props.fixedFeatures.length] = ref} className="featureFrame">
                    </div>
                </div>
            </div>
        );
    }
}

class ConjTable extends React.Component {
    constructor(props) {
        super(props);
    }

    render1d(valueList, rest, list) {
        return (
            <div className="featureTable" style={{gridTemplateColumns: `auto repeat(${list.values.length}, 1fr)`}}>
                <div className="featureHead">{list.name}</div>
                {list.values.map((value, i) => (
                    <div key={"h" + i} className="featureHead">
                        {value}
                    </div>
                ))}
                <div className="featureHead"></div>
                {list.values.map((v, i) => (
                    <div key={"v" + i} className="featureCell">
                        {this.renderFeatures([...valueList, list.select(i)], rest)}
                    </div>
                ))}
            </div>
        );
    }

    render2d(valueList, rest, list0, list1) {
        return (
            <div className="featureTable" style={{gridTemplateColumns: `auto repeat(${list1.values.length}, 1fr)`}}>
                <div className="featureHead">{list0.name} \ {list1.name}</div>
                {list1.values.map((value, i) => (
                    <div key={"h" + i} className="featureHead">
                        {value}
                    </div>
                ))}
                {list0.values.map((v0, i0) => [
                    <div key={i0} className="featureHead">
                        {v0}
                    </div>,
                    ...list1.values.map((v1, i1) => (
                        <div key={"v" + i1} className="featureCell">
                            {this.renderFeatures([...valueList, list0.select(i0), list1.select(i1)], rest)}
                        </div>
                    ))
                ])}
            </div>
        );
    }

    render3d(valueList, rest, list0, list1, list2) {
        return (
            <div>
                <div style={{fontWeight: "bold"}}>{list0.name}</div>
                <div>
                    {list0.values.map((value0, i) => ([
                        <div key={"f2_" + i}>
                            <div style={{fontWeight: "bold"}}>{value0}</div>
                            <div>
                                {this.render2d([...valueList, list0.select(i)], rest, list1, list2)}
                            </div>
                        </div>
                    ]))}
                </div>
            </div>
        );
    }

    generateConjugation(list) {
        let featureSet = {};
        for (let feat of [...list, ...this.props.fixedFeatures]) {
            featureSet[feat.code] = feat;
        }

        let word_c_form = this.props.word.slice(0, -1);
        let word_e_form = '해';
        let word_u_form = '하';
        let word_z_form = '하';

        let action = true;

        let invalid = false;

        if (featureSet.tense.selected() !== 'present') {
            switch(featureSet.p_mood.selected()) {
            case 'imperative': invalid = true; break;
            }
        }

        if (featureSet.hon_subj.selected() === '[+hon.subj]') {
            let u_form = word_u_form;
            word_c_form = u_form + '시';
            word_e_form = u_form + '셔';
            word_u_form = u_form + '시';
            word_z_form = u_form + '시';
        }

        if (featureSet.tense.selected() === 'past') {
            let e_form = word_e_form;
            word_c_form = e_form + 'ㅆ';
            word_e_form = e_form + 'ㅆ어';
            word_u_form = e_form + 'ㅆ으';
            word_z_form = e_form + 'ㅆ스';
        }

        let final = "";
        if (featureSet.hon_2.selected() === '[+hon.2]') {
            if (featureSet.form.selected() === 'formal') {
                switch(featureSet.p_mood.selected()) {
                case 'declarative': final = word_z_form + "ㅂ니다"; break;
                case 'interrogative': final = word_z_form + "ㅂ니까"; break;
                case 'imperative': final = word_z_form + "ㅂ시오"; break;
                }
            }
            else {
                final = word_e_form + "요";
            }
        }
        else {
            if (featureSet.form.selected() === 'formal') {
                switch(featureSet.p_mood.selected()) {
                case 'declarative':
                    if (featureSet.tense.selected() === 'present' && action) {
                        final = word_c_form + (endsInCons(word_c_form)? "는다" : "ㄴ다");
                    }
                    else {
                        final = word_c_form + "다";
                    }
                break;
                case 'interrogative': final = word_c_form + "냐"; break;
                case 'imperative': final = word_e_form + "라"; break;
                }
            }
            else {
                final = word_e_form;
            }
        }

        return invalid? "N/A" : hangulCombine(final);
    }

    renderFeatures(valueList, features) {
        let numFeatures = features.length;

        let tooltip = [];
        for (const feat of valueList) {
            tooltip.push(feat.selected());
        }

        if (numFeatures == 0) {
            return <span title={tooltip.join(' ')}>{this.generateConjugation(valueList)}</span>;
        }
        else if (numFeatures % 3 === 0) {
            return this.render3d(valueList, features.slice(3), ...features.slice(0, 3));
        }
        else if (numFeatures % 3 === 2) {
            return this.render2d(valueList, features.slice(2), ...features.slice(0, 2));
        }
        else if (numFeatures % 3 === 1) {
            return this.render1d(valueList, features.slice(1), ...features.slice(0, 1));
        }
    }

    render() {
        return this.renderFeatures([], this.props.features);
    }
}

function isVowel(letter) {
    let code = letter.charCodeAt(0);
    return (0x1161 <= code && code <= 0x1175);
}

function isCho(letter) {
    let code = letter.charCodeAt(0);
    return (0x1100 <= code && code <= 0x1112);
}

function convertChoToJong(letter) {
    let code = letter.charCodeAt(0);
    return {
        0x1100: 'ᆨ',
        0x1101: 'ᆩ',
        0x1102: 'ᆫ',
        0x1103: 'ᆮ',
        0x1105: 'ᆯ',
        0x1106: 'ᆷ',
        0x1107: 'ᆸ',
        0x1109: 'ᆺ',
        0x110a: 'ᆻ',
        0x110b: 'ᆼ',
        0x110c: 'ᆽ',
        0x110e: 'ᆾ',
        0x110f: 'ᆿ',
        0x1110: 'ᇀ',
        0x1111: 'ᇁ',
        0x1112: 'ᇂ',
    }[code];
}

function endsInCons(word) {
    let letter = word.normalize('NFKD').slice(-1);
    return !isVowel(letter);
}

function hangulCombine(word) {
    word = word.normalize('NFKD');
    let str = "";
    for (let i = 0; i < word.length - 1; ++i) {
        if (isCho(word[i]) && isCho(word[i + 1])) {
            str += convertChoToJong(word[i]);
        }
        else {
            str += word[i];
        }
    }
    str += word[word.length - 1];
    word = str.normalize('NFKC');
    return word;
}

class ConjTablePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            variableFeatures: [
                new Feature('form', 'Formality', ['formal', 'informal']),
                new Feature('hon_subj', 'Subject Honorific', ['[+hon.subj]', '[-hon.subj]']),
                new Feature('hon_2', 'Listener Honorific', ['[+hon.2]', '[-hon.2]']),
           ],
           fixedFeatures: [
                new Feature('p_mood', 'Mood', ['declarative', 'interrogative', 'imperative']),
                new Feature('tense', 'Tense', ['present', 'past']),
           ],
           word: "하다"
        };
    }

    componentDidMount() {
    }

    updateFeatures(variableFeatures, fixedFeatures) {
        this.setState({
            ...this.state,
            variableFeatures: variableFeatures,
            fixedFeatures: fixedFeatures
        });
    }

    handleChange(event) {
        this.setState({
            ...this.state,
            word: event.target.value
        })
    }

    render() {
        return (
            <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                <div>
                    Word:&nbsp;&nbsp;
                    <input
                        type="text"
                        value={this.state.word}
                        onChange={(event) => this.handleChange(event)}
                    />
                </div>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <div style={{flexGrow: 1, marginRight: "10px"}}>
                        <ConjTable
                            features={this.state.variableFeatures}
                            fixedFeatures={this.state.fixedFeatures}
                            word={this.state.word}
                        />
                    </div>
                    <div>
                        <FeatureList
                            variableFeatures={this.state.variableFeatures}
                            fixedFeatures={this.state.fixedFeatures}
                            setFeatures={(variableFeatures, fixedFeatures) => this.updateFeatures(variableFeatures, fixedFeatures)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default ConjTablePage;
