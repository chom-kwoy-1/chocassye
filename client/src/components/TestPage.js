import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { hangul_to_yale, yale_to_hangul } from './YaleToHangul';


function TestWrapper(props) {
    const { t, i18n } = useTranslation();
    const [ state, setState ] = React.useState({
        hangulInput: "한글이라 좋다",
        yaleInput: "GyeyGilGila cwohta",
    });
    
    function handleHangulChange(event) {
        setState({
            ...state,
            hangulInput: event.target.value,
        });
    }
    
    function handleYaleChange(event) {
        setState({
            ...state,
            yaleInput: event.target.value,
        });
    }

    return <div>
        <input
            type="text"
            value={state.hangulInput}
            onChange={(event) => handleHangulChange(event)}
        />
        <br/>
        {hangul_to_yale(state.hangulInput, true)}
        <br/>
        {hangul_to_yale(state.hangulInput, false)}
        <br/>
        <input
            type="text"
            value={state.yaleInput}
            onChange={(event) => handleYaleChange(event)}
        />
        {yale_to_hangul(state.yaleInput)}
    </div>;
}

export default TestWrapper;
