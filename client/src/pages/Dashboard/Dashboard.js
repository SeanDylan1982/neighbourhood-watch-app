import icons from "../../components/Common/Icons";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  CardActionArea,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Campaign as NoticeIcon,
  Report as ReportIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import useApi from "../../hooks/useApi";
import ErrorDisplay from "../../components/Common/ErrorDisplay";
import {
  StatsSkeleton,
  CardSkeleton,
} from "../../components/Common/LoadingSkeleton";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, error, clearError, getWithRetry } = useApi();
  const [stats, setStats] = useState({
    activeChats: 0,
    newNotices: 0,
    openReports: 0,
    neighbours: 0,
  });
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('=== FETCHING DASHBOARD DATA ===');
      clearError();

      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const [statsRes, noticesRes, reportsRes] = await Promise.allSettled([
        getWithRetry(`/api/statistics/dashboard?_t=${timestamp}`),
        getWithRetry(`/api/statistics/recent-notices?limit=3&_t=${timestamp}`),
        getWithRetry(`/api/statistics/recent-reports?limit=3&_t=${timestamp}`),
      ]);

      // Extract results from Promise.allSettled
      const statsResult =
        statsRes.status === "fulfilled" ? statsRes.value : null;
      const noticesResult =
        noticesRes.status === "fulfilled" ? noticesRes.value : null;
      const reportsResult =
        reportsRes.status === "fulfilled" ? reportsRes.value : null;

      // Log any rejected promises for debugging
      if (statsRes.status === "rejected") {
        console.error("Dashboard stats API failed:", statsRes.reason);
      }
      if (noticesRes.status === "rejected") {
        console.error("Recent notices API failed:", noticesRes.reason);
      }
      if (reportsRes.status === "rejected") {
        console.error("Recent reports API failed:", reportsRes.reason);
      }

      // Handle the API response format - check if response has success/data structure
      let statsData, noticesData, reportsData;

      // Process stats response
      if (statsResult?.success && statsResult?.data) {
        statsData = statsResult.data;
      } else if (statsResult?.data) {
        statsData = statsResult.data;
      } else {
        statsData = statsResult || {
          activeChats: 0,
          newNotices: 0,
          openReports: 0,
          neighbours: 0,
        };
      }

      // Process notices response
      if (noticesResult?.success && noticesResult?.data) {
        noticesData = noticesResult.data;
      } else if (noticesResult?.data) {
        noticesData = noticesResult.data;
      } else {
        noticesData = Array.isArray(noticesResult) ? noticesResult : [];
      }

      // Process reports response
      if (reportsResult?.success && reportsResult?.data) {
        reportsData = reportsResult.data;
      } else if (reportsResult?.data) {
        reportsData = reportsResult.data;
      } else {
        reportsData = Array.isArray(reportsResult) ? reportsResult : [];
      }

      console.log('Dashboard stats data:', statsData);
      console.log('Neighbours count:', statsData.neighbours);
      
      setStats(statsData);
      setRecentNotices(Array.isArray(noticesData) ? noticesData : []);
      setRecentReports(Array.isArray(reportsData) ? reportsData : []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Error is already handled by useApi hook
    }
  }, [clearError, getWithRetry]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Listen for back online events to refetch data
  useEffect(() => {
    const handleBackOnline = () => {
      if (user && !loading) {
        fetchDashboardData();
      }
    };

    window.addEventListener("app:back-online", handleBackOnline);
    return () =>
      window.removeEventListener("app:back-online", handleBackOnline);
  }, [user, loading, fetchDashboardData]);

  const statsArray = [
    {
      title: "Active Chats",
      value: (stats?.activeChats || 0).toString(),
      icon: <icons.Chat />,
      color: "primary",
      path: "/chat",
    },
    {
      title: "Total Notices",
      value: (stats?.newNotices || 0).toString(),
      icon: <icons.NoticeBoard />,
      color: "info",
      path: "/notices",
    },
    {
      title: "Open Reports",
      value: (stats?.openReports || 0).toString(),
      icon: <icons.Reports />,
      color: "warning",
      path: "/reports",
    },
    {
      title: "Neighbours",
      value: (stats?.neighbours || 0).toString(),
      icon: <icons.People />,
      color: "success",
      path: "/contacts",
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleNoticeClick = (noticeId) => {
    navigate(`/notices/${noticeId}`);
  };

  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "safety":
        return "error";
      case "event":
        return "success";
      case "lost_found":
        return "warning";
      default:
        return "default";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening in your neighbourhood
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={fetchDashboardData}
          disabled={loading}
          startIcon={<icons.Refresh />}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={fetchDashboardData}
          onDismiss={clearError}
          showDetails={true}
        />
      )}

      {loading && !dataLoaded ? (
        <>
          <StatsSkeleton />
          <Box sx={{ mt: 4 }}>
            <CardSkeleton count={2} />
          </Box>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsArray.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleCardClick(stat.path)}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" component="div">
                            {stat.value}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: `${stat.color}.main` }}>
                          {stat.icon}
                        </Avatar>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Notices */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Recent Notices</Typography>
                    <Button size="small" onClick={() => navigate("/notices")}>
                      View All
                    </Button>
                  </Box>
                  <List>
                    {Array.isArray(recentNotices) &&
                    recentNotices.length > 0 ? (
                      recentNotices.map((notice, index) => (
                        <React.Fragment key={notice.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              px: 0,
                              cursor: "pointer",
                              borderRadius: 1,
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                            onClick={() => handleNoticeClick(notice.id)}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                {notice.category === "event" ? (
                                  <icons.NoticeBoard />
                                ) : notice.category === "safety" ? (
                                  <icons.Warning />
                                ) : (
                                  <icons.NoticeBoard />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="subtitle2">
                                    {notice.title}
                                  </Typography>
                                  <Chip
                                    label={notice.category.replace("_", " ")}
                                    size="small"
                                    color={getCategoryColor(notice.category)}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    By {notice.author} • {notice.time}
                                  </Typography>
                                  {(notice.likes > 0 ||
                                    notice.comments > 0) && (
                                    <Box
                                      sx={{ display: "flex", gap: 1, mt: 0.5 }}
                                    >
                                      {notice.likes > 0 && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {notice.likes} likes
                                        </Typography>
                                      )}
                                      {notice.comments > 0 && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {notice.comments} comments
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < recentNotices.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No recent notices" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Reports */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Recent Reports</Typography>
                    <Button size="small" onClick={() => navigate("/reports")}>
                      View All
                    </Button>
                  </Box>
                  <List>
                    {Array.isArray(recentReports) &&
                    recentReports.length > 0 ? (
                      recentReports.map((report, index) => (
                        <React.Fragment key={report.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              px: 0,
                              cursor: "pointer",
                              borderRadius: 1,
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                            onClick={() => handleReportClick(report.id)}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <icons.Report />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="subtitle2">
                                    {report.title}
                                  </Typography>
                                  <Chip
                                    label={report.severity}
                                    size="small"
                                    color={getSeverityColor(report.severity)}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Status: {report.status} • {report.time}
                                  </Typography>
                                  {report.likes > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {report.likes} likes
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < recentReports.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No recent reports" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
