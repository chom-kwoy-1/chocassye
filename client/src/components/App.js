import React from 'react';
import { Link } from "react-router-dom";
import {useTranslation, withTranslation} from 'react-i18next';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Container, AppBar, Toolbar, Button,
    Typography, Box, IconButton, Menu,
    MenuItem, Paper
} from '@mui/material';
import './i18n';


function App(props) {
    const { t } = useTranslation();

    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    
    function handleOpenNavMenu(event) {
        setAnchorElNav(event.currentTarget);
    }
    function handleOpenUserMenu(event) {
        setAnchorElUser(event.currentTarget);
    }
    function handleCloseNavMenu() {
        setAnchorElNav(null);
    }
    function handleCloseUserMenu() {
        setAnchorElUser(null);
    }

    return (
        <React.Fragment>

            {/* Header */}
            <AppBar position="static" sx={{ background: "linear-gradient(180deg, rgba(152,0,0,1) 13.9%, rgba(134,70,0,1) 14%, rgba(134,70,0,1) 27.9%, rgba(121,119,0,1) 28%, rgba(121,119,0,1) 42.9%, rgba(21,110,0,1) 43%, rgba(21,110,0,1) 56.9%, rgba(0,74,119,1) 57%, rgba(0,74,119,1) 70.9%, rgba(0,22,84,1) 71%, rgba(0,22,84,1) 85.9%, rgba(88,0,124,1) 86%)" }}>
                <Container>
                    <Toolbar disableGutters>

                        {/* For big screens */}
                        <Link to="/">
                            <CollectionsBookmarkIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                        </Link>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.1rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}>
                            <Link to="/">{t('Chocassye')}</Link>
                        </Typography>
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                            <Link to="/search">
                                <Button sx={{ my: 2, color: 'white', display: 'block' }}>{t('Search')}</Button>
                            </Link>
                            <Link to="/howtouse">
                                <Button sx={{ my: 2, color: 'white', display: 'block' }}>{t('How to Use')}</Button>
                            </Link>
                            <Link to="/about">
                                <Button sx={{ my: 2, color: 'white', display: 'block' }}>{t('About')}</Button>
                            </Link>
                        </Box>


                        {/* For small screens */}
                        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                            <IconButton
                                size="large"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={(e) => handleOpenNavMenu(e)}
                                color="inherit">
                            <MenuIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElNav}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                open={Boolean(anchorElNav)}
                                onClose={(e) => handleCloseNavMenu(e)}
                                sx={{
                                    display: { xs: 'block', md: 'none' },
                                }}>
                                <MenuItem>
                                    <Link to="/search">
                                        <Typography textAlign="center">
                                            {t('Search')}
                                        </Typography>
                                    </Link>
                                </MenuItem>
                                <MenuItem>
                                    <Link to="/howtouse">
                                        <Typography textAlign="center">
                                            {t('How to Use')}
                                        </Typography>
                                    </Link>
                                </MenuItem>
                                <MenuItem>
                                    <Link to="/about">
                                        <Typography textAlign="center">
                                            {t('About')}
                                        </Typography>
                                    </Link>
                                </MenuItem>
                            </Menu>
                        </Box>
                        <Typography
                            variant="h5"
                            noWrap
                            sx={{
                                mr: 2,
                                display: { xs: 'flex', md: 'none' },
                                flexGrow: 1,
                                fontWeight: 700,
                                letterSpacing: '.1rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                }}>
                            <Link to="/">{t('Chocassye')}</Link>
                        </Typography>

                        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                            <CollectionsBookmarkIcon />
                        </Box>

                    </Toolbar>
                </Container>
            </AppBar>

            <Container maxWidth="lg" sx={{ mb: 4, px: { xs: 0.2, sm: 2 } }}>
                <Paper variant="outlined" sx={{ my: { xs: 2, md: 4 }, p: { xs: 1, md: 3 } }}>
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
                            display: 'flex',
                            flexGrow: 1,
                            fontWeight: 500,
                            letterSpacing: '.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}>
                        {t('Search Engine')}
                    </Typography>
                </Toolbar>
            </AppBar>
        </React.Fragment>
    );
}

export default withTranslation()(App);
