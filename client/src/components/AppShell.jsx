import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import BriefcaseIcon from '@mui/icons-material/WorkOutline';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiSlice } from '../api/apiSlice';
import { logout } from '../features/auth/authSlice';

export const AppShell = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Cases', path: '/cases', icon: <BriefcaseIcon /> }
  ];

  const goTo = (to) => {
    navigate(to);
    setOpen(false);
  };

  const signOut = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
    setOpen(false);
  };

  const navList = (
    <Box sx={{ width: 280 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Box>
          <Typography fontWeight={800}>Mini Case Tracker</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <IconButton onClick={() => setOpen(false)} aria-label="Close menu">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton key={item.path} selected={pathname === item.path || pathname.startsWith(`${item.path}/`)} onClick={() => goTo(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton onClick={signOut}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1, display: { md: 'none' } }} aria-label="Open menu">
            <MenuIcon />
          </IconButton>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>M</Avatar>
            <Box>
              <Typography fontWeight={800} lineHeight={1}>
                Mini Case Tracker
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.name} / {user?.role}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navItems.map((item) => (
              <Button key={item.path} color="inherit" startIcon={item.icon} onClick={() => goTo(item.path)}>
                {item.label}
              </Button>
            ))}
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={signOut}>
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)}>
        {navList}
      </Drawer>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};
