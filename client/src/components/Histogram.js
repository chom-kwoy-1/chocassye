import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams } from "react-router-dom";
import ReactPaginate from 'react-paginate';
import { highlight } from './Highlight';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Interweave } from 'interweave';
import HowToPageWrapper from './HowToPage';
import { Trans } from 'react-i18next';


const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));


export default class Histogram extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        const BEGIN = 1400;
        const END = 2000;

        let hits = this.props.data.map((decade) => decade.num_hits).sort((a, b) => a > b);
        let median_hits = hits.length > 0 ? hits[Math.floor(hits.length / 2)] : 0;
        let acc_count = 0;

        return <div className='histogramContainerContainer'>
            <div className='histogramContainer'>
                {range(BEGIN, END - 50, 50).map((year, i) => {
                    return <div key={i} className='halfCentury'>
                        <span className='hCLabel'>{year}</span>
                    </div>
                })}
            </div>
            <div className='histogramOverlay'>
                {this.props.data.map((decade, i) => {
                    let percentage = (decade.period - BEGIN) / (END - BEGIN) * 100;
                    let style = {
                        left: percentage + "%",
                        width: (100 / ((END - BEGIN) / 10)) + "%",
                        opacity: decade.num_hits / median_hits + 0.1
                    };
                    let tooltip = this.props.t('number decade', { decade: decade.period }) + ': '
                                + this.props.t('number Results', { numResults: decade.num_hits });

                    let page_idx = 1 + Math.floor(acc_count / this.props.pageN);
                    acc_count += decade.num_hits;
                    let click = () => {
                        this.props.setPage(page_idx);
                    };

                    return <div
                        key={i}
                        className="tooltip"
                        data-title={tooltip}
                        style={style}
                        onClick={click}
                    ></div>
                })}
            </div>
        </div>
    }
}
