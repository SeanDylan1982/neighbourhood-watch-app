import { Analytics } from "@vercel/analytics/react";
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BRAND } from "./constants/branding";
import "./styles/layout.css";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import { MessageProvider } from "./contexts/MessageContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import OfflineIndicator from "./components/Common/OfflineIndicator";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Chat from "./pages/Chat/Chat";
import { UnifiedChat } from "./pages/Chat";
import NoticeBoard from "./pages/NoticeBoard/NoticeBoard";
import Reports from "./pages/Reports/Reports";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import Contacts from "./pages/Contacts/Contacts";
import SearchPage from "./pages/Search/SearchPage";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { CookiesModal } from "./components/Legal";
import useCookieConsent from "./hooks/useCookieConsent";
import { ToastProvider } from "./components/Common/Toast";
import { ToastContainer } from "./components/Common/Toast";
import serviceWorkerManager from "./services/ServiceWorkerManager";
import manifestValidator from "./services/ManifestValidator";
import productionErrorHandler from "./services/ProductionErrorHandler";

const theme = createTheme({
  palette: {
    primary: {
      main: BRAND.colors.primary,
      light: "#6BA3E8",
      dark: "#2E6BB8",
    },
    secondary: {
      main: BRAND.colors.secondary,
      light: "#F7D368",
      dark: "#C4A935",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function App() {
  const {
    showCookieModal,
    acceptAllCookies,
    acceptEssentialOnly,
    dismissModal,
    closeCookieModal,
  } = useCookieConsent();

  // Initialize app-level services
  useEffect(() => {
    document.title = BRAND.metadata.title;

    // Initialize service worker with error handling
    const initServiceWorker = async () => {
      try {
        const result = await serviceWorkerManager.register("/sw.js");
        if (result.success) {
          console.log("✅ Service worker initialized successfully");
        } else {
          console.warn(
            "⚠️ Service worker initialization failed:",
            result.error
          );
          productionErrorHandler.handleServiceWorkerError(result.error, {
            phase: "initialization",
            details: result.details,
          });
        }
      } catch (error) {
        console.error("❌ Service worker initialization error:", error);
        productionErrorHandler.handleServiceWorkerError("registration_failed", {
          phase: "initialization",
          error: error.message,
        });
      }
    };

    // Initialize manifest validation
    const initManifestValidation = async () => {
      try {
        const validation = await manifestValidator.validateManifest();
        if (validation.isValid) {
          console.log("✅ Manifest validation successful");
        } else {
          console.warn("⚠️ Manifest validation failed:", validation.message);
          productionErrorHandler.handleManifestError(validation.errorType, {
            phase: "validation",
            message: validation.message,
          });

          // Try to fix manifest issues
          const fixResult = await manifestValidator.fixManifestIssues();
          if (fixResult.success) {
            console.log("✅ Manifest issues fixed with fallback");
          } else {
            console.error("❌ Failed to fix manifest issues:", fixResult.error);
          }
        }
      } catch (error) {
        console.error("❌ Manifest validation error:", error);
        productionErrorHandler.handleManifestError("syntax_error", {
          phase: "validation",
          error: error.message,
        });
      }
    };

    // Initialize production error handling
    const initErrorHandling = () => {
      // Set up error notification listener
      const handleProductionError = (event) => {
        const { type, severity, message } = event.detail;
        console.log(
          `🔔 Production error notification: ${type} (${severity}): ${message}`
        );

        // You can integrate with your toast notification system here
        // For now, we'll just log it
      };

      window.addEventListener("production-error", handleProductionError);

      // Cleanup function
      return () => {
        window.removeEventListener("production-error", handleProductionError);
      };
    };

    // Initialize all systems
    const cleanupErrorHandling = initErrorHandling();
    initServiceWorker();
    initManifestValidation();

    // Cleanup on unmount
    return cleanupErrorHandling;
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OfflineIndicator />
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <MessageProvider>
                <ToastProvider>
                  <Router>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <Analytics />
                              <Layout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                          />
                          <Route
                            path="dashboard"
                            element={
                              <ErrorBoundary>
                                <Dashboard />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="chat"
                            element={
                              <ErrorBoundary>
                                <UnifiedChat />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="chat/group/:chatId"
                            element={
                              <ErrorBoundary>
                                <UnifiedChat />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="chat/private/:chatId"
                            element={
                              <ErrorBoundary>
                                <UnifiedChat />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="chat-legacy"
                            element={
                              <ErrorBoundary>
                                <Chat />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="notices"
                            element={
                              <ErrorBoundary>
                                <NoticeBoard />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="notices/:id"
                            element={
                              <ErrorBoundary>
                                <NoticeBoard />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="reports"
                            element={
                              <ErrorBoundary>
                                <Reports />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="reports/:id"
                            element={
                              <ErrorBoundary>
                                <Reports />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="contacts"
                            element={
                              <ErrorBoundary>
                                <Contacts />
                              </ErrorBoundary>
                            }
                          />
                          {/* Legacy private chat routes - redirect to unified chat */}
                          <Route
                            path="private-chat"
                            element={
                              <Navigate to="/chat?tab=private" replace />
                            }
                          />
                          <Route
                            path="private-chat/:chatId"
                            element={
                              <Navigate to="/chat?tab=private" replace />
                            }
                          />
                          <Route
                            path="profile"
                            element={
                              <ErrorBoundary>
                                <Profile />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="settings"
                            element={
                              <ErrorBoundary>
                                <Settings />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="search"
                            element={
                              <ErrorBoundary>
                                <SearchPage />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="notifications"
                            element={
                              <ErrorBoundary>
                                <Notifications />
                              </ErrorBoundary>
                            }
                          />
                          <Route
                            path="admin"
                            element={
                              <ErrorBoundary>
                                <ProtectedAdminRoute>
                                  <AdminDashboard />
                                </ProtectedAdminRoute>
                              </ErrorBoundary>
                            }
                          />
                        </Route>
                      </Routes>
                    </ErrorBoundary>
                    <ToastContainer />
                  </Router>
                </ToastProvider>
              </MessageProvider>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>

        {/* Global Cookie Consent Modal */}
        <CookiesModal
          open={showCookieModal}
          onClose={closeCookieModal}
          onAccept={acceptAllCookies}
          onDecline={acceptEssentialOnly}
          onDismiss={dismissModal}
          alreadyAccepted={false}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
