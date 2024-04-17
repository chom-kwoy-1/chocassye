import React from 'react';
import { Link } from "react-router-dom";
import { withTranslation } from 'react-i18next';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Container, AppBar, Toolbar, Button,
    Typography, Box, IconButton, Menu,
    MenuItem, Paper
} from '@mui/material';

import './i18n';


class App extends React.Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            anchorElNav: null,
            anchorElUser: null,
        };
    }
    
    handleOpenNavMenu(event) {
        this.setState({
            ...this.state,
            anchorElNav: event.currentTarget,
        });
    }
    handleOpenUserMenu(event) {
        this.setState({
            ...this.state,
            anchorElUser: event.currentTarget,
        });
    }
    handleCloseNavMenu() {
        this.setState({
            ...this.state,
            anchorElNav: null,
        });
    }
    handleCloseUserMenu() {
        this.setState({
            ...this.state,
            anchorElUser: null,
        });
    }
    
    render() {
        return (
            <React.Fragment>
            
                {/* Header */}
                <AppBar position="static">
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
                                <Link to="/">{this.props.t('Chocassye')}</Link>
                            </Typography>
                            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                                <Link to="/search">
                                    <Button sx={{ my: 2, color: 'white', display: 'block' }}>{this.props.t('Search')}</Button>
                                </Link>
                                <Link to="/howtouse">
                                    <Button sx={{ my: 2, color: 'white', display: 'block' }}>{this.props.t('How to Use')}</Button>
                                </Link>
                                <Link to="/about">
                                    <Button sx={{ my: 2, color: 'white', display: 'block' }}>{this.props.t('About')}</Button>
                                </Link>
                            </Box>
                            
                            {/* For small screens */}
                            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                                <IconButton
                                    size="large"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={(e) => this.handleOpenNavMenu(e)}
                                    color="inherit">
                                <MenuIcon />
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={this.state.anchorElNav}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                    open={Boolean(this.state.anchorElNav)}
                                    onClose={(e) => this.handleCloseNavMenu(e)}
                                    sx={{
                                        display: { xs: 'block', md: 'none' },
                                    }}>
                                    <MenuItem>
                                        <Link to="/search">
                                            <Typography textAlign="center">
                                                {this.props.t('Search')}
                                            </Typography>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem>
                                        <Link to="/howtouse">
                                            <Typography textAlign="center">
                                                {this.props.t('How to Use')}
                                            </Typography>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem>
                                        <Link to="/about">
                                            <Typography textAlign="center">
                                                {this.props.t('About')}
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
                                <Link to="/">{this.props.t('Chocassye')}</Link>
                            </Typography>
                            
                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                                <CollectionsBookmarkIcon />
                            </Box>
                            
                        </Toolbar>
                    </Container>
                </AppBar>

                <Container maxWidth="lg" sx={{ mb: 4 }}>
                    <Paper variant="outlined" sx={{ my: { xs: 3, md: 4 }, p: { xs: 2, md: 3 } }}>
                        {this.props.children}
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
                            {this.props.t('Search Engine')}
                        </Typography>
                    </Toolbar>
                </AppBar>
            </React.Fragment>
        );
    }
}

export default withTranslation()(App);
