import DefaultHeadshot from '../assets/default_headshot.png';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { GlobalContext } from '../GlobalContext';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import {useNavigate} from 'react-router-dom';
import { useState, useContext } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import {useCookies} from 'react-cookie';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';

const ResponsiveAppBar = ({ setIsOpen, setChat }) => {
  const [cookies, setCookie, removeCookie] = useCookies(null);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { user, socket } = useContext(GlobalContext);

  let navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const goToChat = () => {
    if(anchorElNav) {
        handleCloseNavMenu();
    } else {
        handleCloseUserMenu();
    }
    setChat(true);
  }

  const goToProfiles = () => {
    if(anchorElNav) {
        handleCloseNavMenu();
    } else {
        handleCloseUserMenu();
    }
    setChat(false);
  }

  const logout = () => {
    if(anchorElNav) {
      handleCloseNavMenu();
    } else {
        handleCloseUserMenu();
    }
    if(socket) {
      socket.emit("leave", {userId: cookies.UserId});
      socket.close();
    }
    removeCookie('UserId', cookies.UserId)
    removeCookie('AuthToken', cookies.AuthToken)
    navigate("/");
}

const updateProfile = () => {
  if(anchorElNav) {
    handleCloseNavMenu();
  } else {
      handleCloseUserMenu();
  }
    navigate("/onboarding");
}

const deleteProfile = () => {
  if(anchorElNav) {
    handleCloseNavMenu();
  } else {
      handleCloseUserMenu();
  }
  if(socket) {
    socket.emit("leave", {userId: cookies.UserId});
    socket.close();
  }
  setIsOpen(true)
}

  return (
    <AppBar position="static" sx={{backgroundColor: '#77b5d9'}}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 'bolder',
              fontSize: '2em',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Fusic
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
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
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem  onClick={goToChat}>
                  <Typography textAlign="center">Chat</Typography>
                </MenuItem>
                <MenuItem  onClick={goToProfiles}>
                  <Typography textAlign="center">Profiles</Typography>
                </MenuItem>
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 'bolder',
              fontSize: '2em',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Fusic
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
                onClick={goToProfiles}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Profiles
              </Button>
              <Button
                onClick={goToChat}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Chat
              </Button>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={`${user.first_name}`} src={`${user.picture === "none" ? DefaultHeadshot : user.picture}`} />
            </IconButton>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={updateProfile}>
                 <Typography textAlign="center">Update Profile</Typography>
              </MenuItem>
              <MenuItem onClick={logout}>
                 <Typography textAlign="center">Logout</Typography>
              </MenuItem>
              <MenuItem onClick={deleteProfile}>
                 <Typography textAlign="center">Delete Account</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
export default ResponsiveAppBar;
