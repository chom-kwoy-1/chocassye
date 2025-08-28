import {
  Box,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import React from "react";
import { Trans } from "react-i18next";

import { useTranslation } from "./TranslationProvider";
import "./i18n";

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 700,
    paddingLeft: 3,
    paddingRight: 3,
    textAlign: "center",
    typography: "body2",
  },
  [`&.${tableCellClasses.body}`]: {
    paddingLeft: 3,
    paddingRight: 3,
    textAlign: "center",
    typography: "body2",
  },
}));

function MarkdownListItem(props) {
  return <Box component="li" sx={{ mt: 1, typography: "body2" }} {...props} />;
}

function HowToPageWrapper(props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ px: 2 }}>
      <Typography variant="h4">
        {props.title ?? t("How to Use Chocassye")}
      </Typography>

      <Box>
        <Typography variant="h5">{t("Basic Usage")}</Typography>
        <Divider />
      </Box>

      <Typography component="p" variant="body2">
        <Trans i18nKey="basic-usage-0">
          You can search the database with <strong>Hangul</strong>,{" "}
          <strong>romanization</strong>, or a <strong>mix of both</strong>, as
          demonstrated below. All queries are automatically converted to
          romanized form before querying the database, as the internal format of
          the database is in romanized form.
        </Trans>
      </Typography>

      <TableContainer
        component={Paper}
        sx={{ my: 1, maxWidth: 450 }}
        style={{ marginLeft: "auto", marginRight: "auto" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>{t("Input")}</StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell>{t("Hangul Form")}</StyledTableCell>
              <StyledTableCell>{t("Actual Query")}</StyledTableCell>
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

      <Typography component="p" variant="body2">
        <Trans i18nKey="basic-usage-1">
          We use a <strong>modified Yale Romanization</strong> system. Here are
          the most important differences:
        </Trans>
      </Typography>

      <ul>
        <MarkdownListItem>
          <Trans i18nKey="rom-detail-1">
            <strong>
              ‘ㅇ’ is always romanized into ‘<code>G</code>’
            </strong>{" "}
            (a capital G) regardless of the environment it appears in.
          </Trans>
        </MarkdownListItem>
        <MarkdownListItem>
          <Trans i18nKey="rom-detail-2">
            <strong>
              Letter blocks are always separated by a ‘<code>.</code>’
            </strong>{" "}
            (full stop), unless already separated by a space.
          </Trans>
        </MarkdownListItem>
        <MarkdownListItem>
          <Trans i18nKey="rom-detail-3">
            For ‘ㅛ’ and ‘ㅠ’, we use{" "}
            <strong>
              ‘<code>yo</code>’ and ‘<code>yu</code>’
            </strong>{" "}
            instead of ‘<code>ywo</code>’ and ‘<code>ywu</code>’.
          </Trans>
        </MarkdownListItem>
        <MarkdownListItem>
          <Trans i18nKey="rom-detail-4">
            A letter block without an initial letter is romanized as if the
            initial letter is ‘<code>`</code>’ (a single backtick). For example,
            ᅟᅵᆫ → <code>`in</code>.
          </Trans>
        </MarkdownListItem>
      </ul>

      <Typography component="p" variant="body2">
        <Trans i18nKey="rom-detail-5">
          The chart below shows the full correspondence between Hangul letters
          and our romanization.
        </Trans>
      </Typography>

      <TableContainer
        component={Paper}
        sx={{ my: 1, maxWidth: 550 }}
        style={{ marginLeft: "auto", marginRight: "auto" }}
      >
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
        <Typography variant="h5">{t("Advanced Usage")}</Typography>
        <Divider />
      </Box>

      <Typography variant="h6">{t("Wildcards")}</Typography>
      <Typography component="div" variant="body2">
        <Trans i18nKey="wildcard-detail-0">
          We support two types of wildcards for advanced searching.
        </Trans>
        <ul>
          <MarkdownListItem>
            <Trans i18nKey="wildcard-detail-1">
              The <code>‘_’</code> (underscore) matches any <strong>one</strong>{" "}
              romanized letter.
            </Trans>
          </MarkdownListItem>
          <MarkdownListItem>
            <Trans i18nKey="wildcard-detail-2">
              The <code>‘%’</code> (percent sign) matches{" "}
              <strong>any number</strong> of letters, including zero.
            </Trans>
          </MarkdownListItem>
        </ul>
      </Typography>

      <Box>
        <Typography variant="h6">
          <Trans i18nKey="startend-detail-0">
            Find sentences that starts with or ends with a certain phrase
          </Trans>
        </Typography>
        <Typography component="div" variant="body2">
          <ul>
            <MarkdownListItem>
              <Trans i18nKey="startend-detail-1">
                To find a sentence that <strong>starts with</strong> a certain
                phrase, prepend a &ldquo;<code>^</code>&rdquo; (caret) to the
                query string.
              </Trans>
            </MarkdownListItem>
            <MarkdownListItem>
              <Trans i18nKey="startend-detail-2">
                To find a sentence that <strong>ends with</strong> a certain
                phrase, append a &ldquo;<code>$</code>&rdquo; (dollar sign) to
                the query string.
              </Trans>
            </MarkdownListItem>
          </ul>
        </Typography>
      </Box>

      <Typography variant="h6">{t("Regular Expression Search")}</Typography>
      <Typography component="div" variant="body2">
        <Trans i18nKey="regex-detail-1">
          You can use regular expressions to search for specific patterns in the
          text.
        </Trans>
        <ul>
          <MarkdownListItem>
            <Trans i18nKey="regex-detail-2">
              To use regular expressions, start and end your query with a{" "}
              <code>/</code> (slash).
            </Trans>
          </MarkdownListItem>
          <MarkdownListItem>
            <Trans i18nKey="regex-detail-3">
              You can only use romanized letters in regular expressions. Be
              careful to escape the syllable separator with &ldquo;
              <code>\.</code>&rdquo;!
            </Trans>
          </MarkdownListItem>
          <MarkdownListItem>
            <Trans i18nKey="regex-detail-4">
              For example, entering <code>/cho\.c[ou]\.ni/</code> will match
              both <code>cho.co.ni</code> (ᄎᆞᄌᆞ니) and <code>cho.cu.ni</code>{" "}
              (ᄎᆞ즈니).
            </Trans>
          </MarkdownListItem>
          <MarkdownListItem>
            <Trans i18nKey="regex-detail-5">
              Some regular expression features may not be supported.
            </Trans>
          </MarkdownListItem>
          <MarkdownListItem>
            <Trans i18nKey="regex-detail-6">
              Searching with regular expressions can be slow, especially for
              complex patterns. If a search takes more than 10 seconds, it will
              be automatically stopped. In that case, try to narrow down your
              search term.
            </Trans>
          </MarkdownListItem>
        </ul>
      </Typography>
    </Stack>
  );
}

export default HowToPageWrapper;
