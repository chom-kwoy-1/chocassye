import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';


function AboutWrapper(props) {
    const { t, i18n } = useTranslation();

    return <div>
    <h1>{t('About')}</h1>

    <h2>序</h2>

    <div className='paragraph'>
        <p>國語之根甚, 從古有以文記</p>
        <p>나라의 말씀이 뿌리가 깊건마는, 예로부터 문자로 기록된 것이 있어도,</p>

        <p>乎罔易査之法淺</p>
        <p>웹에서 쉽게 검색하는 방법이 변변치 아니하여,</p>

        <p>故幼生有所欲探</p>
        <p>이런 연유로 어린 학도가 찾으려고 할 바가 있어도,</p>

        <p>而終不得探之者多矣</p>
        <p>마침내 가히 찾지 못하고 마는 이들이 많으니라.</p>

        <p>予爲此新製史言塊探機, 名曰ᄎᆞ자쎠</p>
        <p>나는 이를 위하여 새로 「ᄎᆞ자쎠」라는 역사 말뭉치 검색 엔진을 만드나니</p>

        <p>欲使人人易習便於日用耳</p>
        <p>사람마다 쉽게 익혀, 날로 쓰기에 편안케 하고자 할 따름이니라.</p>
    </div>

    <h2>이름의 의미</h2>

    <div className='paragraph'>
        <p>&lsquo;ᄎᆞ자쎠&rsquo;는 &lsquo;찾으시오!&rsquo; (Find it!)이라는 의미의 중세 한국어입니다.</p>
    </div>

    <h2>자료 출처</h2>

    <div className='paragraph'>
        <p>
            자료는 국립국어원의 '역사 자료 종합 정비'를 사용하였습니다.
        </p>
    </div>

    <h2>지은이</h2>

    <div className='paragraph'>
        <p>참괴</p>
    </div>
    </div>;
}

export default AboutWrapper;
