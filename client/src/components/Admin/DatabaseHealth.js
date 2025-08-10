import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from "@mui/material";

const DatabaseHealth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [detailedMetrics, setDetailedMetrics] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cache for detailed metrics to avoid redundant requests
  const [detailedMetricsCache, setDetailedMetricsCache] = useState({});
  const CACHE_DURATION = 60000; // 1 minute cache

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
    fetchTimeSeriesData();

    // Set up auto-refresh (reduced frequency to avoid rate limiting)
    const interval = setInterval(() => {
      fetchMetrics();
    }, 120000); // Refresh every 2 minutes instead of 1 minute

    setRefreshInterval(interval);

    // Clean up on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []); // Empty dependency array to run only once

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Fetch basic metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/database-metrics");
      setMetrics(response.data.metrics);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching database metrics:", err);

      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        setError(
          "Too many requests. The dashboard will automatically retry in a few minutes."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load database metrics"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch time series data for charts
  const fetchTimeSeriesData = async () => {
    try {
      const response = await axios.get("/api/database-metrics/time-series", {
        params: { period: "hourly", limit: 24 },
      });
      setTimeSeriesData(response.data);
    } catch (err) {
      console.error("Error fetching time series data:", err);
    }
  };

  // Fetch detailed metrics based on type with caching
  const fetchDetailedMetrics = async (type) => {
    try {
      // Check cache first
      const cacheKey = type;
      const cachedData = detailedMetricsCache[cacheKey];
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setDetailedMetrics(cachedData.data);
        return;
      }

      const response = await axios.get(`/api/database-metrics/${type}`, {
        params: { limit: 20 },
      });

      const data = response.data.metrics;
      setDetailedMetrics(data);

      // Update cache
      setDetailedMetricsCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data,
          timestamp: now,
        },
      }));
    } catch (err) {
      console.error(`Error fetching ${type} metrics:`, err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Fetch detailed metrics based on tab
    switch (newValue) {
      case 1:
        fetchDetailedMetrics("connection");
        break;
      case 2:
        fetchDetailedMetrics("query");
        break;
      case 3:
        fetchDetailedMetrics("pool");
        break;
      case 4:
        fetchDetailedMetrics("latency");
        break;
      default:
        // Overview tab doesn't need detailed metrics
        break;
    }
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchMetrics();
    fetchTimeSeriesData();

    // Also refresh detailed metrics if on a specific tab
    if (activeTab > 0) {
      const types = ["", "connection", "query", "pool", "latency"];
      fetchDetailedMetrics(types[activeTab]);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get connection status color
  const getStatusColor = (isConnected, readyState) => {
    if (!isConnected || readyState !== 1) return "error";
    return "success";
  };

  // Get status text
  const getStatusText = (isConnected, readyState) => {
    if (!isConnected) return "Disconnected";

    switch (readyState) {
      case 0:
        return "Disconnected";
      case 1:
        return "Connected";
      case 2:
        return "Connecting";
      case 3:
        return "Disconnecting";
      default:
        return "Unknown";
    }
  };

  // Render loading state
  if (loading && !metrics) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error && !metrics) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h2">
          Database Health Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={handleRefresh} sx={{ mr: 2 }}>
            Refresh
          </Button>
          {lastUpdated && (
            <Typography variant="caption" color="textSecondary">
              Last updated: {formatDate(lastUpdated)}
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Connection" />
        <Tab label="Query Performance" />
        <Tab label="Connection Pool" />
        <Tab label="Latency" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 &&
        metrics &&
        metrics.connection &&
        metrics.query &&
        metrics.latency &&
        metrics.pool && (
          <Grid container spacing={3}>
            {/* Connection Status Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Connection Status
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={getStatusText(
                        metrics.connection?.isConnected,
                        metrics.connection?.readyState
                      )}
                      color={getStatusColor(
                        metrics.connection?.isConnected,
                        metrics.connection?.readyState
                      )}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h5" component="div">
                      {metrics.connection?.readyState === 1
                        ? "Healthy"
                        : "Issues Detected"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Uptime:{" "}
                    {metrics.connection?.uptime
                      ? `${Math.floor(metrics.connection.uptime / 60)} minutes`
                      : "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Connection Stats Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Connection Stats
                  </Typography>
                  <Typography variant="h5" component="div">
                    {metrics.connection?.reconnects || 0} Reconnects
                  </Typography>
                  <Typography variant="body2">
                    Success: {metrics.connection?.success || 0} | Failures:{" "}
                    {metrics.connection?.failures || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Query Stats Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Query Performance
                  </Typography>
                  <Typography variant="h5" component="div">
                    {metrics.query?.total || 0} Operations
                  </Typography>
                  <Typography variant="body2">
                    Success Rate:{" "}
                    {((metrics.query?.successRate || 0) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Avg Latency: {(metrics.latency?.avgQuery || 0).toFixed(1)}ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pool Utilization Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Connection Pool
                  </Typography>
                  <Typography variant="h5" component="div">
                    {metrics.pool?.maxSize || 0} Max Connections
                  </Typography>
                  <Typography variant="body2">
                    Utilization:{" "}
                    {((metrics.pool?.utilization || 0) * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

      {/* Connection Tab */}
      {activeTab === 1 && (
        <Box>
          {detailedMetrics ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Connection State</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailedMetrics?.history || []).map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(event.timestamp)}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.eventType}
                          color={
                            event.eventType === "connected" ||
                            event.eventType === "reconnected"
                              ? "success"
                              : event.eventType === "error"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {event.connectionStats?.isConnected
                          ? "Connected"
                          : "Disconnected"}{" "}
                        (State: {event.connectionStats?.readyState})
                      </TableCell>
                      <TableCell>
                        {event.error && (
                          <Typography color="error">{event.error}</Typography>
                        )}
                        <Typography variant="caption">
                          Operations: {event.connectionStats?.operations} |
                          Failures: {event.connectionStats?.failures} |
                          Reconnects: {event.connectionStats?.reconnects}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      )}

      {/* Query Performance Tab */}
      {activeTab === 2 && (
        <Box>
          {detailedMetrics ? (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Operations
                      </Typography>
                      <Typography variant="h4">
                        {detailedMetrics?.total || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Successful Operations
                      </Typography>
                      <Typography variant="h4">
                        {detailedMetrics?.successful || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Failed Operations
                      </Typography>
                      <Typography variant="h4">
                        {detailedMetrics?.failed || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Latency (ms)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Success Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailedMetrics?.history || []).map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(event.timestamp)}</TableCell>
                        <TableCell>
                          {event.latency ? event.latency.toFixed(1) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.success ? "Success" : "Failed"}
                            color={event.success ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {((event.successRate || 0) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      )}

      {/* Connection Pool Tab */}
      {activeTab === 3 && (
        <Box>
          {detailedMetrics ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Charts require the 'recharts' package. Please install it to
                  view visualizations.
                </Alert>
                <Typography variant="subtitle1" gutterBottom>
                  Pool Utilization Data
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{ maxHeight: 200, overflow: "auto" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Utilization</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(detailedMetrics?.history || [])
                        .slice(0, 5)
                        .map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              {((entry.utilization || 0) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Active Connections</TableCell>
                      <TableCell>Max Pool Size</TableCell>
                      <TableCell>Utilization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailedMetrics?.history || []).map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(event.timestamp)}</TableCell>
                        <TableCell>
                          {event.activeConnections || "N/A"}
                        </TableCell>
                        <TableCell>{event.maxPoolSize || "N/A"}</TableCell>
                        <TableCell>
                          {((event.utilization || 0) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      )}

      {/* Latency Tab */}
      {activeTab === 4 && (
        <Box>
          {detailedMetrics ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Charts require the 'recharts' package. Please install it to
                  view visualizations.
                </Alert>
                <Typography variant="subtitle1" gutterBottom>
                  Latency Data
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{ maxHeight: 200, overflow: "auto" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Query Latency (ms)</TableCell>
                        <TableCell>Connection Latency (ms)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(detailedMetrics?.history || [])
                        .slice(0, 5)
                        .map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              {entry.connectionStats?.avgQueryLatency || "N/A"}
                            </TableCell>
                            <TableCell>
                              {entry.connectionStats?.avgConnectionLatency ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Query Latency (ms)</TableCell>
                      <TableCell>Connection Latency (ms)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailedMetrics?.history || []).map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(event.timestamp)}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            color={
                              event.status === "healthy"
                                ? "success"
                                : event.status === "warning"
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {event.connectionStats?.avgQueryLatency || "N/A"}
                        </TableCell>
                        <TableCell>
                          {event.connectionStats?.avgConnectionLatency || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DatabaseHealth;
