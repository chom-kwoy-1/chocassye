"use client";

import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LanguageIcon from "@mui/icons-material/Language";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import {
  TranslationContext,
  useTranslation,
} from "@/components/TranslationProvider";
import { darkTheme, lightTheme } from "@/themes";

import { ThemeContext } from "./ThemeContext";

function App(props) {
  const [lng, setLng] = React.useContext(TranslationContext);
  const { t } = useTranslation();
  const router = useRouter();

  const [curTheme, setCurTheme] = React.useContext(ThemeContext);

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElLang, setAnchorElLang] = React.useState(null);

  function handleOpenNavMenu(event) {
    setAnchorElNav(event.currentTarget);
  }
  function handleCloseNavMenu() {
    setAnchorElNav(null);
  }

  function handleOpenLangMenu(event) {
    setAnchorElLang(event.currentTarget);
  }
  function handleCloseLangMenu() {
    setAnchorElLang(null);
  }

  let appbarStyle = {};

  // check if it's pride month
  let today = new Date();
  let prideMonth = today.getMonth() === 5; // June is month 5
  if (prideMonth) {
    // rainbow gradient
    appbarStyle = {
      background:
        "linear-gradient(180deg, rgba(152,0,0,1) 13.9%, rgba(134,70,0,1) 14%, " +
        "rgba(134,70,0,1) 27.9%, rgba(121,119,0,1) 28%, rgba(121,119,0,1) 42.9%, " +
        "rgba(21,110,0,1) 43%, rgba(21,110,0,1) 56.9%, rgba(0,74,119,1) 57%, " +
        "rgba(0,74,119,1) 70.9%, rgba(0,22,84,1) 71%, rgba(0,22,84,1) 85.9%, " +
        "rgba(88,0,124,1) 86%)",
    };
  }

  function handleLangSelect(newLang) {
    setLng(newLang);
  }

  return (
    <React.Fragment>
      {/* Header */}
      <AppBar position="static" sx={appbarStyle}>
        <Container>
          <Toolbar disableGutters>
            {/* For big screens */}
            <Link href={`/search`}>
              <CollectionsBookmarkIcon
                sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
              />
            </Link>
            <Typography
              variant="h6"
              noWrap
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <Box
                onClick={() => router.push(`/search`)}
                sx={{ cursor: "pointer" }}
              >
                {t("Chocassye")}
              </Box>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                onClick={() => router.push(`/search`)}
              >
                {t("Search")}
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                onClick={() => router.push(`/sourcelist`)}
              >
                {t("Sources")}
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                onClick={() => router.push(`/howtouse`)}
              >
                {t("How to Use")}
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                onClick={() => router.push(`/word`)}
              >
                {t("Machwoassye")}
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                onClick={() => router.push(`/about`)}
              >
                {t("About")}
              </Button>
            </Box>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              <IconButton
                size="large"
                aria-controls="lang-change-appbar"
                aria-haspopup="true"
                onClick={() =>
                  setCurTheme(curTheme === lightTheme ? darkTheme : lightTheme)
                }
                color="inherit"
              >
                {curTheme === lightTheme ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
            <Box sx={{ minWidth: 150, display: { xs: "none", md: "flex" } }}>
              <ThemeProvider theme={darkTheme}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="lang-select-label">
                    {t("Language")}
                  </InputLabel>
                  <Select
                    variant="outlined"
                    labelId="lang-select-label"
                    onChange={(event) => handleLangSelect(event.target.value)}
                    value={lng}
                  >
                    <MenuItem value="ko">{t("Korean")}</MenuItem>
                    <MenuItem value="en">{t("English")}</MenuItem>
                  </Select>
                </FormControl>
              </ThemeProvider>
            </Box>

            {/* For small screens */}
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={(e) => handleOpenNavMenu(e)}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={(e) => handleCloseNavMenu(e)}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                <MenuItem onClick={() => router.push(`/search`)}>
                  <Typography textAlign="center">{t("Search")}</Typography>
                </MenuItem>
                <MenuItem onClick={() => router.push(`/sourcelist`)}>
                  <Typography textAlign="center">{t("Sources")}</Typography>
                </MenuItem>
                <MenuItem onClick={() => router.push(`/howtouse`)}>
                  <Typography textAlign="center">{t("How to Use")}</Typography>
                </MenuItem>
                <MenuItem onClick={() => router.push(`/word`)}>
                  <Typography textAlign="center">{t("Machwoassye")}</Typography>
                </MenuItem>
                <MenuItem onClick={() => router.push(`/about`)}>
                  <Typography textAlign="center">{t("About")}</Typography>
                </MenuItem>
              </Menu>
            </Box>
            <Typography
              variant="h5"
              noWrap
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <Box
                onClick={() => router.push(`/search`)}
                sx={{ cursor: "pointer" }}
              >
                {t("Chocassye")}
              </Box>
            </Typography>

            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-controls="lang-change-appbar"
                aria-haspopup="true"
                onClick={() =>
                  setCurTheme(curTheme === lightTheme ? darkTheme : lightTheme)
                }
                color="inherit"
              >
                {curTheme === lightTheme ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>

            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-controls="lang-change-appbar"
                aria-haspopup="true"
                onClick={(e) => handleOpenLangMenu(e)}
                color="inherit"
              >
                <LanguageIcon />
              </IconButton>
              <Menu
                id="lang-change-appbar"
                anchorEl={anchorElLang}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElLang)}
                onClose={(e) => handleCloseLangMenu(e)}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                <MenuItem onClick={() => handleLangSelect("ko")}>
                  <Typography textAlign="center">{t("Korean")}</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleLangSelect("en")}>
                  <Typography textAlign="center">{t("English")}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mb: 4, px: { xs: 0.2, sm: 2 } }}>
        <Paper
          variant="outlined"
          sx={{ my: { xs: 2, md: 4 }, p: { xs: 1, md: 3 } }}
        >
          {props.children}
        </Paper>
      </Container>

      {/* Footer */}
      <AppBar position="static">
        <Toolbar disableGutters>
          <Typography
            variant="h7"
            noWrap
            justifyContent="center"
            alignItems="center"
            sx={{
              mr: 2,
              display: "flex",
              flexGrow: 1,
              fontWeight: 500,
              letterSpacing: ".1rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {t("Search Engine")}
          </Typography>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
}

export default App;
