import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import icons from "../Common/Icons";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../Common/Logo/Logo";
import { BRAND } from "../../constants/branding";

const drawerWidthExpanded = 230;
const drawerWidthCollapsed = 70;

const menuItems = [
  {
    text: "Dashboard",
    icon: <icons.Dashboard size={24} />,
    path: "/dashboard",
  },
  { text: "Messages", icon: <icons.Chat size={24} />, path: "/chat" },
  {
    text: "Notice Board",
    icon: <icons.NoticeBoard size={24} />,
    path: "/notices",
  },
  { text: "Reports", icon: <icons.Reports size={24} />, path: "/reports" },
  { text: "Contacts", icon: <icons.Contacts size={24} />, path: "/contacts" },
];

const getBottomMenuItems = (userRole) => {
  const items = [
    { text: "Profile", icon: <icons.Profile size={24} />, path: "/profile" },
    { text: "Settings", icon: <icons.Settings size={24} />, path: "/settings" },
  ];

  if (userRole === "admin") {
    items.unshift({
      text: "Admin Panel",
      icon: <icons.Admin size={24} />,
      path: "/admin",
    });
  }

  return items;
};

const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  // Save sidebar state preference when it changes
  useEffect(() => {
    const saveSidebarPreference = async () => {
      try {
        const baseURL =
          process.env.REACT_APP_API_URL || "http://localhost:5001";
        const response = await fetch(`${baseURL}/api/settings/interface`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sidebarExpanded: !collapsed,
          }),
        });

        if (!response.ok) {
          console.error(
            "Failed to save sidebar preference:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error saving sidebar preference:", error);
      }
    };

    // Only save if the user is logged in and the sidebar state has changed
    if (user) {
      saveSidebarPreference();
    }
  }, [collapsed, user]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < theme.breakpoints.values.md) {
      onClose();
    }
  };

  const renderMenuItems = (items) => {
    return items.map((item) => (
      <ListItem key={item.text} disablePadding>
        <Tooltip title={collapsed ? item.text : ""} placement="right" arrow>
          <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? "center" : "initial",
              px: 2.5,
              "&.Mui-selected": {
                backgroundColor: "primary.light",
                color: "primary.contrastText",
                "&:hover": {
                  backgroundColor: "primary.main",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? "auto" : 3,
                justifyContent: "center",
                color:
                  location.pathname === item.path
                    ? "inherit"
                    : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.text} />}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    ));
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo and Brand Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          cursor: "pointer",
          "&:hover": { opacity: 0.8 },
        }}
        onClick={() => navigate("/dashboard")}
      >
        <Box sx={{ display: "flex", alignItems: "left" }}>
          {/* <Logo size="small" /> */}
          {!collapsed && (  
            <Typography
              variant="h6"
              sx={{
                ml: 1,
                fontWeight: 600,
                color: "primary.main",
              }}
            >
              {/* {BRAND.name} */}
            </Typography>
          )}
        </Box>
        {!collapsed && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {collapsed && (
        <Box sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
          <IconButton onClick={onToggleCollapse}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      <Divider />

      <List sx={{ flex: 1 }}>{renderMenuItems(menuItems)}</List>

      <Divider />

      <List>{renderMenuItems(getBottomMenuItems(user?.role))}</List>
    </Box>
  );

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
          boxSizing: "border-box",
          position: "relative",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: "hidden",
          // Hide scrollbar while maintaining functionality
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // Internet Explorer 10+
          "&::-webkit-scrollbar": {
            display: "none", // WebKit browsers (Chrome, Safari, Edge)
          },
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
