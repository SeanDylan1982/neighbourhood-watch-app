import icons from "../Common/Icons";
import React, { useState, useEffect } from "react";
import Logo from "../Common/Logo/Logo";
import { BRAND } from "../../constants/branding";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  Settings,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getFullImageUrl, getUserInitials } from "../../utils/imageUtils";
import DataSyncIndicator from "../Common/DataSyncIndicator";
import DatabaseHealthIndicator from "../Common/DatabaseHealthIndicator";
import SearchBar from "../Search/SearchBar";
import useSearchNavigation from "../../hooks/useSearchNavigation";
import NotificationBell from "../Common/NotificationBell";
import * as offlineQueue from "../../utils/offlineOperationQueue";


const TopBar = ({ isSidebarCollapsed, onSidebarCollapseToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [pendingOperations, setPendingOperations] = useState([]);
  const { navigateToResult } = useSearchNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor offline queue
  useEffect(() => {
    const updateQueue = () => {
      setPendingOperations(offlineQueue.getQueue());
    };

    // Update initial state
    updateQueue();

    // Listen for queue events
    window.addEventListener("offline:operation-queued", updateQueue);
    window.addEventListener("offline:operation-removed", updateQueue);
    window.addEventListener("offline:queue-cleared", updateQueue);
    window.addEventListener("offline:processing-started", updateQueue);
    window.addEventListener("offline:processing-completed", updateQueue);

    return () => {
      window.removeEventListener("offline:operation-queued", updateQueue);
      window.removeEventListener("offline:operation-removed", updateQueue);
      window.removeEventListener("offline:queue-cleared", updateQueue);
      window.removeEventListener("offline:processing-started", updateQueue);
      window.removeEventListener("offline:processing-completed", updateQueue);
    };
  }, []);

  // Update sync status based on online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus("idle");
    const handleOffline = () => setSyncStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial status
    setSyncStatus(navigator.onLine ? "idle" : "offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    handleMenuClose();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Mobile menu items
  const mobileMenuItems = [
    { text: "Dashboard", icon: <icons.Dashboard />, path: "/dashboard" },
    { text: "Messages", icon: <icons.Message />, path: "/chat" },
    { text: "Notice Board", icon: <icons.NoticeBoard />, path: "/notices" },
    { text: "Reports", icon: <icons.Reports />, path: "/reports" },
    { text: "Contacts", icon: <icons.Contacts />, path: "/contacts" },
    { text: "Profile", icon: <icons.Profile />, path: "/profile" },
    { text: "Settings", icon: <icons.Settings />, path: "/settings" },
  ];

  if (user?.role === "admin") {
    mobileMenuItems.push({
      text: "Admin Panel",
      icon: <icons.Admin />,
      path: "/admin",
    });
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <icons.Menu />
            </IconButton>
          )}

          {/* Logo and Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              mr: 2,
            }}
            onClick={() => navigate("/dashboard")}
          >
            <Logo
              size="medium"
              onClick={() => navigate("/dashboard")}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                display: { xs: "none", sm: "block" },
                marginLeft: "10px",
                fontSize: "2rem",
                fontWeight: 600,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {BRAND.name}
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", sm: "none", md: "flex" },
              justifyContent: "center",
              alignItems: "center",
              mx: "auto",
            }}
          >
            <SearchBar
              placeholder="Search people, notices, reports, chats..."
              onResultSelect={navigateToResult}
              sx={{
                height: "30px",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DataSyncIndicator
              syncStatus={syncStatus}
              pendingOperations={pendingOperations}
              onProcessQueue={() => {
                // This will be handled by individual components using useDataSync
                console.log("Processing offline queue from TopBar");
                return Promise.resolve();
              }}
            />

            {/* Only show database health indicator for admin users */}
            {user?.role === "admin" && (
              <Box sx={{ mx: 1 }}>
                <DatabaseHealthIndicator size="small" />
              </Box>
            )}

            <NotificationBell />

            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                src={getFullImageUrl(`${user?.profileImageUrl}`)}
                alt={user?.firstName}
                sx={{ width: 40, height: 40, border: "2px solid #f1f1f1" }}
              >
                {getUserInitials(user)}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <icons.Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Hamburger Menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Menu</Typography>
        </Box>
        <Divider />
        <List>
          {mobileMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleMobileNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default TopBar;
