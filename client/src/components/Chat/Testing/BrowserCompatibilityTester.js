/**
 * Browser Compatibility Tester Component
 * Provides UI for running cross-browser compatibility tests
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { CrossBrowserTestRunner, BrowserTestScenarios } from '../../../utils/crossBrowserTesting';
import { BrowserDetection } from '../../../utils/browserCompatibility';

const BrowserCompatibilityTester = () => {
  const [testRunner] = useState(() => new CrossBrowserTestRunner());
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);

  // Browser info
  const browserInfo = {
    name: BrowserDetection.getBrowser(),
    version: BrowserDetection.getBrowserVersion(),
    isMobile: BrowserDetection.isMobile(),
    isIOS: BrowserDetection.isIOS(),
    isAndroid: BrowserDetection.isAndroid(),
    userAgent: navigator.userAgent
  };

  // Run all compatibility tests
  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest('Initializing tests...');

    try {
      // Mock progress updates
      const totalScenarios = Object.keys(BrowserTestScenarios).length;
      let completedScenarios = 0;

      const originalRunScenario = testRunner.runScenario.bind(testRunner);
      testRunner.runScenario = async (scenario) => {
        setCurrentTest(`Running ${scenario.name} tests...`);
        const result = await originalRunScenario(scenario);
        completedScenarios++;
        setProgress((completedScenarios / totalScenarios) * 100);
        return result;
      };

      const testResults = await testRunner.runAllTests();
      setResults(testResults);
      setCurrentTest('Tests completed!');
    } catch (error) {
      console.error('Test execution error:', error);
      setCurrentTest(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  // Run specific test scenario
  const runSpecificTest = async (scenarioName) => {
    const scenario = BrowserTestScenarios[scenarioName];
    if (!scenario) return;

    setIsRunning(true);
    setCurrentTest(`Running ${scenario.name} tests...`);

    try {
      const result = await testRunner.runScenario(scenario);
      
      // Update results with specific scenario
      setResults(prev => ({
        ...prev,
        scenarios: {
          ...prev?.scenarios,
          [scenarioName]: result
        }
      }));
    } catch (error) {
      console.error('Specific test error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  // Export test results
  const exportResults = () => {
    if (!results) return;
    
    testRunner.results = results;
    testRunner.exportResults();
  };

  // Get status color for test results
  const getStatusColor = (success) => {
    return success ? 'success' : 'error';
  };

  // Get status icon for test results
  const getStatusIcon = (success) => {
    return success ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />;
  };

  // Calculate overall compatibility score
  const getCompatibilityScore = () => {
    if (!results?.scenarios) return 0;
    
    const totalTests = Object.values(results.scenarios).reduce(
      (sum, scenario) => sum + scenario.tests.length, 0
    );
    const passedTests = Object.values(results.scenarios).reduce(
      (sum, scenario) => sum + scenario.passed, 0
    );
    
    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Browser Compatibility Tester
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test chat functionality across different browsers and identify compatibility issues.
        </Typography>
      </Box>

      {/* Browser Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Browser Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Browser
                </Typography>
                <Typography variant="h6">
                  {browserInfo.name}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="h6">
                  {browserInfo.version}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Platform
                </Typography>
                <Typography variant="h6">
                  {browserInfo.isMobile ? 'Mobile' : 'Desktop'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  OS
                </Typography>
                <Typography variant="h6">
                  {browserInfo.isIOS ? 'iOS' : browserInfo.isAndroid ? 'Android' : 'Other'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Compatibility Tests
            </Typography>
            <Box>
              {results && (
                <Tooltip title="Export Results">
                  <IconButton onClick={exportResults} disabled={isRunning}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Run All Tests">
                <IconButton onClick={runAllTests} disabled={isRunning}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={runAllTests}
            disabled={isRunning}
            startIcon={<BugReportIcon />}
            sx={{ mb: 2 }}
          >
            {isRunning ? 'Running Tests...' : 'Run All Compatibility Tests'}
          </Button>

          {isRunning && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {currentTest}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* Compatibility Score */}
          {results && (
            <Alert 
              severity={getCompatibilityScore() >= 80 ? 'success' : getCompatibilityScore() >= 60 ? 'warning' : 'error'}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">
                Compatibility Score: {getCompatibilityScore()}%
              </Typography>
              <Typography variant="body2">
                {getCompatibilityScore() >= 80 
                  ? 'Excellent compatibility! Your browser supports most chat features.'
                  : getCompatibilityScore() >= 60
                  ? 'Good compatibility with some limitations.'
                  : 'Limited compatibility. Some features may not work properly.'
                }
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      {Object.entries(BrowserTestScenarios).map(([scenarioName, scenario]) => (
        <Accordion key={scenarioName} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {scenario.name}
              </Typography>
              {results?.scenarios?.[scenarioName] && (
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  <Chip
                    label={`${results.scenarios[scenarioName].passed} passed`}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label={`${results.scenarios[scenarioName].failed} failed`}
                    color="error"
                    size="small"
                  />
                </Box>
              )}
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  runSpecificTest(scenarioName);
                }}
                disabled={isRunning}
              >
                Test
              </Button>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {results?.scenarios?.[scenarioName] ? (
              <List>
                {results.scenarios[scenarioName].tests.map((test, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getStatusIcon(test.success)}
                    </ListItemIcon>
                    <ListItemText
                      primary={test.name}
                      secondary={test.message}
                    />
                    <Chip
                      label={`${test.duration?.toFixed(0) || 0}ms`}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Click "Test" to run {scenario.name.toLowerCase()} tests.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Compatibility Issues */}
      {results?.compatibility?.issues?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Compatibility Issues
            </Typography>
            <List>
              {results.compatibility.issues.map((issue, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {results?.compatibility?.recommendations?.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recommendations
            </Typography>
            <List>
              {results.compatibility.recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BrowserCompatibilityTester;