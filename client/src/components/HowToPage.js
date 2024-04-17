import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';


function HowToPageWrapper(props) {
    const { t, i18n } = useTranslation();

    return <div>
        <h1>{props.title?? t('How to Use Chocassye')}</h1>

        <h2>{t('Basic Usage')}</h2>

        <div className='paragraph'>
            <Trans i18nKey="You can search the database with" />

            <table>
                <thead>
                    <tr>
                        <th>{t('Input')}</th>
                        <th></th>
                        <th>{t('Hangul Form')}</th>
                        <th>{t('Actual Query')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>이더라</td>
                        <td>→</td>
                        <td>이더라</td>
                        <td>Gi.te.la</td>
                    </tr>
                    <tr>
                        <td>ho.Wo.za</td>
                        <td>→</td>
                        <td>ᄒᆞᄫᆞᅀᅡ</td>
                        <td>ho.Wo.za</td>
                    </tr>
                    <tr>
                        <td>ho.거든</td>
                        <td>→</td>
                        <td>ᄒᆞ거든</td>
                        <td>ho.ke.tun</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className='paragraph'>
            <Trans i18nKey="We use a modified Yale Romanization" />

             <ul>
                 <li>
                     <Trans i18nKey="rom-detail-1" />
                 </li>
                 <li>
                     <Trans i18nKey="rom-detail-2" />
                 </li>
                 <li>
                     <Trans i18nKey="rom-detail-3" />
                 </li>
                 <li>
                     <Trans i18nKey="rom-detail-4" />
                 </li>
             </ul>
             <Trans i18nKey="The chart below shows" />
            
            <div className='tableWrapper'>
            <table className='jamotable'>
                <tbody>
                    <tr>
                        <th>ㄱ</th>
                        <th>ㅋ</th>
                        <th>ㆁ</th>
                        <th>ㄴ</th>
                        <th>ㄷ</th>
                        <th>ㅌ</th>
                        <th>ㅁ</th>
                        <th>ㅂ</th>
                        <th>ㅍ</th>
                        <th>ㅇ</th>
                        <th>ㅎ</th>
                        <th>ㆆ</th>
                        <th>ㄹ</th>
                        <th>ㅿ</th>
                        <th>ㅸ</th>
                    </tr>
                    <tr>
                        <td>k</td>
                        <td>kh</td>
                        <td>ng</td>
                        <td>n</td>
                        <td>t</td>
                        <td>th</td>
                        <td>m</td>
                        <td>p</td>
                        <td>ph</td>
                        <td>G</td>
                        <td>h</td>
                        <td>q</td>
                        <td>l</td>
                        <td>z</td>
                        <td>W</td>
                    </tr>
                    <tr>
                        <th>ᄼ</th>
                        <th>ᄽ</th>
                        <th>ᅎ</th>
                        <th>ᅏ</th>
                        <th>ᅔ</th>
                        <th>ᄾ</th>
                        <th>ᄿ</th>
                        <th>ᅐ</th>
                        <th>ᅑ</th>
                        <th>ᅕ</th>
                        <th>ㅱ</th>
                        <th>( )</th>
                    </tr>
                    <tr>
                        <td>s/</td>
                        <td>ss/</td>
                        <td>c/</td>
                        <td>cc/</td>
                        <td>ch/</td>
                        <td>s\</td>
                        <td>ss\</td>
                        <td>c\</td>
                        <td>cc\</td>
                        <td>ch\</td>
                        <td>M</td>
                        <td>&#96;</td>
                    </tr>
                    <tr>
                        <th>ᆞ</th>
                        <th>ㅗ</th>
                        <th>ㅛ</th>
                        <th>ㅡ</th>
                        <th>ㅜ</th>
                        <th>ㅠ</th>
                        <th>ㅏ</th>
                        <th>ㅘ</th>
                        <th>ㅑ</th>
                        <th>ㆇ</th>
                        <th>ㅓ</th>
                        <th>ㅝ</th>
                        <th>ㅕ</th>
                        <th>ㆊ</th>
                        <th>ㅣ</th>
                    </tr>
                    <tr>
                        <td>o</td>
                        <td>wo</td>
                        <td>yo</td>
                        <td>u</td>
                        <td>wu</td>
                        <td>yu</td>
                        <td>a</td>
                        <td>wa</td>
                        <td>ya</td>
                        <td>ywa</td>
                        <td>e</td>
                        <td>we</td>
                        <td>ye</td>
                        <td>ywe</td>
                        <td>i</td>
                    </tr>
                    <tr>
                        <th>ㆎ</th>
                        <th>ㅚ</th>
                        <th>ㆉ</th>
                        <th>ㅢ</th>
                        <th>ㅟ</th>
                        <th>ㆌ</th>
                        <th>ㅐ</th>
                        <th>ㅙ</th>
                        <th>ㅒ</th>
                        <th>ㆈ</th>
                        <th>ㅔ</th>
                        <th>ㅞ</th>
                        <th>ㅖ</th>
                        <th>ㆋ</th>
                    </tr>
                    <tr>
                        <td>oy</td>
                        <td>woy</td>
                        <td>yoy</td>
                        <td>uy</td>
                        <td>wuy</td>
                        <td>yuy</td>
                        <td>ay</td>
                        <td>way</td>
                        <td>yay</td>
                        <td>yway</td>
                        <td>ey</td>
                        <td>wey</td>
                        <td>yey</td>
                        <td>ywey</td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>

        <h2>{t('Advanced Usage')}</h2>

        <h3>{t('Wildcards')}</h3>
        <div className='paragraph'>
            <Trans i18nKey="We support two types of wildcards" />

            <ul>
                <li><Trans i18nKey="wildcard-detail-1" /></li>
                <li><Trans i18nKey="wildcard-detail-2" /></li>
            </ul>
        </div>

        <h3>{t('Find sentences that starts with or ends with a certain phrase')}</h3>

        <div className='paragraph'>
            <Trans i18nKey="startend-detail-1" />
            <table>
                <tbody><tr><td>예시 추가 예정</td></tr></tbody>
            </table>
        </div>

        <div className='paragraph'>
            <Trans i18nKey="startend-detail-2" />
            <table>
                <tbody><tr><td>예시 추가 예정</td></tr></tbody>
            </table>
        </div>
    </div>;
}

export default HowToPageWrapper;
