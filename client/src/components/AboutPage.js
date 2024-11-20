import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import {Box, Divider, Stack, Typography} from "@mui/material";


function AboutWrapper(props) {
    const { t } = useTranslation();

    return <Stack spacing={2} sx={{px: 2}}>
        <h1>{t('About')}</h1>

        <Box>
            <Typography variant='h5'>{t('序')}</Typography>
            <Divider />
        </Box>

        <Box>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                國語之根深, 從古有以文記<br/>
                나라의 말씀이 뿌리가 깊건마는, 예로부터 문자로 기록된 것이 있어도,
            </Typography>

            <Typography component='p' variant='body2' sx={{pb: 2}}>
                乎罔易探之法淺<br/>
                웹에서 쉽게 검색하는 방법이 변변치 아니하여,
            </Typography>

            <Typography component='p' variant='body2' sx={{pb: 2}}>
                故幼生有所欲探<br/>
                이런 연유로 어린 학도가 찾으려고 할 바가 있어도,
            </Typography>

            <Typography component='p' variant='body2' sx={{pb: 2}}>
                而終不得探之者多矣<br/>
                마침내 가히 찾지 못하고 마는 이들이 많으니라.
            </Typography>

            <Typography component='p' variant='body2' sx={{pb: 2}}>
                予爲此新製史言塊探機, 名曰ᄎᆞ자쎠<br/>
                나는 이를 위하여 새로 「ᄎᆞ자쎠」라는 역사 말뭉치 검색 엔진을 만드나니
            </Typography>

            <Typography component='p' variant='body2' sx={{pb: 2}}>
                欲使人人易習便於日用耳<br/>
                사람마다 쉽게 익혀, 날로 쓰기에 편안케 하고자 할 따름이니라.
            </Typography>
        </Box>

        <Box>
            <Typography variant='h5'>{t('이름의 의미')}</Typography>
            <Divider />
        </Box>

        <Box>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                &lsquo;ᄎᆞ자쎠&rsquo;는 &lsquo;찾으시오!&rsquo; (Find it!)이라는 의미의 중세 한국어입니다.
            </Typography>
        </Box>

        <Box>
            <Typography variant='h5'>{t('자료 출처')}</Typography>
            <Divider />
        </Box>

        <Box>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                한글 자료는 국립국어원의 &lsquo;역사 자료 종합 정비&rsquo;를 사용하였습니다.
                석독구결 자료는 <a href="https://kohico.kr/" target="blank">kohico.kr</a>에 공개되어 있는 sktot 자료를 사용하였습니다.
                일부 자료는 디지털 장서각에서 가져왔습니다.
                이 외의 자료는 자료 페이지 내 표시된 출처를 참조하시기 바랍니다.
            </Typography>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                위 자료들의 제작에 참여하신 분들께 감사를 표합니다.
            </Typography>
        </Box>

        <Box>
            <Typography variant='h5'>{t('지은 이')}</Typography>
            <Divider />
        </Box>

        <Box>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                ᄎᆞᆷ괴
            </Typography>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                문의·건의사항: <a href="mailto:chom.kwoy@됬.xyz" target="blank">chom.kwoy@됬.xyz</a>
            </Typography>
        </Box>

        <Box>
            <Typography variant='h5'>{t('자매 프로젝트')}</Typography>
            <Divider />
        </Box>

        <Box>
            <Typography component='p' variant='body2' sx={{pb: 2}}>
                <ul>
                    <li><a href="https://됬.xyz/old-hangul-ime/" target="blank">온라인 옛한글 입력기</a></li>
                    <li><a href="https://blog.됬.xyz/" target="blank">ᄎᆞᆷ괴로운 블로그 (개발자의 블로그)</a></li>
                </ul>
            </Typography>
        </Box>

    </Stack>;
}

export default AboutWrapper;
