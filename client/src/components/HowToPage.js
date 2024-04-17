import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import {
    Grid, Typography, FormControlLabel,
    Checkbox, Box, Pagination, Paper,
    TableContainer, Table, TableHead, TableBody,
    TableRow, TableCell, Divider, Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 700,
    paddingLeft: 3,
    paddingRight: 3,
    textAlign: "center",
    typography: 'body2'
  },
  [`&.${tableCellClasses.body}`]: {
    paddingLeft: 3,
    paddingRight: 3,
    textAlign: "center",
    typography: 'body2'
  },
}));

function MarkdownListItem(props) {
  return <Box component="li" sx={{ mt: 1, typography: 'body2' }} {...props} />;
}

function HowToPageWrapper(props) {
    const { t, i18n } = useTranslation();

    return <Stack spacing={2} sx={{px: 2}}>
        
        <Typography variant='h4'>{props.title?? t('How to Use Chocassye')}</Typography>
        
        <Box>
            <Typography variant='h5'>{t('Basic Usage')}</Typography>
            <Divider />
        </Box>

        <Typography component='p' variant='body2'>
            <Trans i18nKey="You can search the database with" />
        </Typography>
        
        <TableContainer 
            component={Paper} 
            sx={{ my: 1, maxWidth: 450 }} 
            style={{ marginLeft: "auto", marginRight: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <StyledTableCell>{t('Input')}</StyledTableCell>
                        <StyledTableCell></StyledTableCell>
                        <StyledTableCell>{t('Hangul Form')}</StyledTableCell>
                        <StyledTableCell>{t('Actual Query')}</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>이더라</StyledTableCell>
                        <StyledTableCell>→</StyledTableCell>
                        <StyledTableCell>이더라</StyledTableCell>
                        <StyledTableCell>Gi.te.la</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>ho.Wo.za</StyledTableCell>
                        <StyledTableCell>→</StyledTableCell>
                        <StyledTableCell>ᄒᆞᄫᆞᅀᅡ</StyledTableCell>
                        <StyledTableCell>ho.Wo.za</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>ho.거든</StyledTableCell>
                        <StyledTableCell>→</StyledTableCell>
                        <StyledTableCell>ᄒᆞ거든</StyledTableCell>
                        <StyledTableCell>ho.ke.tun</StyledTableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>

        <Typography component='p' variant='body2'>
            <Trans i18nKey="We use a modified Yale Romanization" />
        </Typography>

        <ul>
            <MarkdownListItem>
                <Trans i18nKey="rom-detail-1" />
            </MarkdownListItem>
            <MarkdownListItem>
                <Trans i18nKey="rom-detail-2" />
            </MarkdownListItem>
            <MarkdownListItem>
                <Trans i18nKey="rom-detail-3" />
            </MarkdownListItem>
            <MarkdownListItem>
                <Trans i18nKey="rom-detail-4" />
            </MarkdownListItem>
        </ul>
        
        <Typography component='p' variant='body2'>
             <Trans i18nKey="The chart below shows" />
        </Typography>
            
        <TableContainer 
            component={Paper} 
            sx={{ my: 1, maxWidth: 550 }} 
            style={{ marginLeft: "auto", marginRight: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <StyledTableCell>ㄱ</StyledTableCell>
                        <StyledTableCell>ㅋ</StyledTableCell>
                        <StyledTableCell>ㆁ</StyledTableCell>
                        <StyledTableCell>ㄴ</StyledTableCell>
                        <StyledTableCell>ㄷ</StyledTableCell>
                        <StyledTableCell>ㅌ</StyledTableCell>
                        <StyledTableCell>ㅁ</StyledTableCell>
                        <StyledTableCell>ㅂ</StyledTableCell>
                        <StyledTableCell>ㅍ</StyledTableCell>
                        <StyledTableCell>ㅇ</StyledTableCell>
                        <StyledTableCell>ㅎ</StyledTableCell>
                        <StyledTableCell>ㆆ</StyledTableCell>
                        <StyledTableCell>ㄹ</StyledTableCell>
                        <StyledTableCell>ㅿ</StyledTableCell>
                        <StyledTableCell>ㅸ</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>k</StyledTableCell>
                        <StyledTableCell>kh</StyledTableCell>
                        <StyledTableCell>ng</StyledTableCell>
                        <StyledTableCell>n</StyledTableCell>
                        <StyledTableCell>t</StyledTableCell>
                        <StyledTableCell>th</StyledTableCell>
                        <StyledTableCell>m</StyledTableCell>
                        <StyledTableCell>p</StyledTableCell>
                        <StyledTableCell>ph</StyledTableCell>
                        <StyledTableCell>G</StyledTableCell>
                        <StyledTableCell>h</StyledTableCell>
                        <StyledTableCell>q</StyledTableCell>
                        <StyledTableCell>l</StyledTableCell>
                        <StyledTableCell>z</StyledTableCell>
                        <StyledTableCell>W</StyledTableCell>
                    </TableRow>
                </TableBody>
                <TableHead>
                    <TableRow>
                        <StyledTableCell>ㅅ</StyledTableCell>
                        <StyledTableCell>ㅈ</StyledTableCell>
                        <StyledTableCell>ㅊ</StyledTableCell>
                        <StyledTableCell>ᄼ</StyledTableCell>
                        <StyledTableCell>ᄽ</StyledTableCell>
                        <StyledTableCell>ᅎ</StyledTableCell>
                        <StyledTableCell>ᅏ</StyledTableCell>
                        <StyledTableCell>ᅔ</StyledTableCell>
                        <StyledTableCell>ᄾ</StyledTableCell>
                        <StyledTableCell>ᄿ</StyledTableCell>
                        <StyledTableCell>ᅐ</StyledTableCell>
                        <StyledTableCell>ᅑ</StyledTableCell>
                        <StyledTableCell>ᅕ</StyledTableCell>
                        <StyledTableCell>ㅱ</StyledTableCell>
                        <StyledTableCell>( )</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>s</StyledTableCell>
                        <StyledTableCell>c</StyledTableCell>
                        <StyledTableCell>ch</StyledTableCell>
                        <StyledTableCell>s/</StyledTableCell>
                        <StyledTableCell>ss/</StyledTableCell>
                        <StyledTableCell>c/</StyledTableCell>
                        <StyledTableCell>cc/</StyledTableCell>
                        <StyledTableCell>ch/</StyledTableCell>
                        <StyledTableCell>s\</StyledTableCell>
                        <StyledTableCell>ss\</StyledTableCell>
                        <StyledTableCell>c\</StyledTableCell>
                        <StyledTableCell>cc\</StyledTableCell>
                        <StyledTableCell>ch\</StyledTableCell>
                        <StyledTableCell>M</StyledTableCell>
                        <StyledTableCell>&#96;</StyledTableCell>
                    </TableRow>
                </TableBody>
                <TableHead>
                    <TableRow>
                        <StyledTableCell>ᆞ</StyledTableCell>
                        <StyledTableCell>ㅗ</StyledTableCell>
                        <StyledTableCell>ㅛ</StyledTableCell>
                        <StyledTableCell>ㅡ</StyledTableCell>
                        <StyledTableCell>ㅜ</StyledTableCell>
                        <StyledTableCell>ㅠ</StyledTableCell>
                        <StyledTableCell>ㅏ</StyledTableCell>
                        <StyledTableCell>ㅘ</StyledTableCell>
                        <StyledTableCell>ㅑ</StyledTableCell>
                        <StyledTableCell>ㆇ</StyledTableCell>
                        <StyledTableCell>ㅓ</StyledTableCell>
                        <StyledTableCell>ㅝ</StyledTableCell>
                        <StyledTableCell>ㅕ</StyledTableCell>
                        <StyledTableCell>ㆊ</StyledTableCell>
                        <StyledTableCell>ㅣ</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>o</StyledTableCell>
                        <StyledTableCell>wo</StyledTableCell>
                        <StyledTableCell>yo</StyledTableCell>
                        <StyledTableCell>u</StyledTableCell>
                        <StyledTableCell>wu</StyledTableCell>
                        <StyledTableCell>yu</StyledTableCell>
                        <StyledTableCell>a</StyledTableCell>
                        <StyledTableCell>wa</StyledTableCell>
                        <StyledTableCell>ya</StyledTableCell>
                        <StyledTableCell>ywa</StyledTableCell>
                        <StyledTableCell>e</StyledTableCell>
                        <StyledTableCell>we</StyledTableCell>
                        <StyledTableCell>ye</StyledTableCell>
                        <StyledTableCell>ywe</StyledTableCell>
                        <StyledTableCell>i</StyledTableCell>
                    </TableRow>
                </TableBody>
                <TableHead>
                    <TableRow>
                        <StyledTableCell>ㆎ</StyledTableCell>
                        <StyledTableCell>ㅚ</StyledTableCell>
                        <StyledTableCell>ㆉ</StyledTableCell>
                        <StyledTableCell>ㅢ</StyledTableCell>
                        <StyledTableCell>ㅟ</StyledTableCell>
                        <StyledTableCell>ㆌ</StyledTableCell>
                        <StyledTableCell>ㅐ</StyledTableCell>
                        <StyledTableCell>ㅙ</StyledTableCell>
                        <StyledTableCell>ㅒ</StyledTableCell>
                        <StyledTableCell>ㆈ</StyledTableCell>
                        <StyledTableCell>ㅔ</StyledTableCell>
                        <StyledTableCell>ㅞ</StyledTableCell>
                        <StyledTableCell>ㅖ</StyledTableCell>
                        <StyledTableCell>ㆋ</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>oy</StyledTableCell>
                        <StyledTableCell>woy</StyledTableCell>
                        <StyledTableCell>yoy</StyledTableCell>
                        <StyledTableCell>uy</StyledTableCell>
                        <StyledTableCell>wuy</StyledTableCell>
                        <StyledTableCell>yuy</StyledTableCell>
                        <StyledTableCell>ay</StyledTableCell>
                        <StyledTableCell>way</StyledTableCell>
                        <StyledTableCell>yay</StyledTableCell>
                        <StyledTableCell>yway</StyledTableCell>
                        <StyledTableCell>ey</StyledTableCell>
                        <StyledTableCell>wey</StyledTableCell>
                        <StyledTableCell>yey</StyledTableCell>
                        <StyledTableCell>ywey</StyledTableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>

        <Box>
            <Typography variant='h5'>{t('Advanced Usage')}</Typography>
            <Divider />
        </Box>

        <Typography variant='h6'>{t('Wildcards')}</Typography>
        <Typography component='div' variant='body2'>
            <Trans i18nKey="We support two types of wildcards" />
            <ul>
                <MarkdownListItem><Trans i18nKey="wildcard-detail-1" /></MarkdownListItem>
                <MarkdownListItem><Trans i18nKey="wildcard-detail-2" /></MarkdownListItem>
            </ul>
        </Typography>
        
        <Box>
            <Typography variant='h6'>{t('Find sentences that starts with or ends with a certain phrase')}</Typography>
            <Typography component='div' variant='body2'>
                <ul>
                    <MarkdownListItem><Trans i18nKey="startend-detail-1" /></MarkdownListItem>
                    <MarkdownListItem><Trans i18nKey="startend-detail-2" /></MarkdownListItem>
                </ul>
            </Typography>
        </Box>
        
    </Stack>;
}

export default HowToPageWrapper;
