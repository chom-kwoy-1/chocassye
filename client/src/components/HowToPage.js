import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';


function HowToPageWrapper(props) {
    const { t, i18n } = useTranslation();

    return <div>
        <h1>{t('How to Use Chocassye')}</h1>

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
                        <td>ho거든</td>
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
        </div>

        <div className='paragraph'>
            <Trans i18nKey="startend-detail-2" />
        </div>
    </div>;
}

export default HowToPageWrapper;
