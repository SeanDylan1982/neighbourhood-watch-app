import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import LegalDocumentViewer from '../../components/Legal/LegalDocumentViewer';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [legalDocumentOpen, setLegalDocumentOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState('');
  const { register, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle opening legal documents
  const handleOpenLegalDocument = (documentType, title) => {
    setSelectedDocumentType(documentType);
    setSelectedDocumentTitle(title);
    setLegalDocumentOpen(true);
  };

  const handleCloseLegalDocument = () => {
    setLegalDocumentOpen(false);
    setSelectedDocumentType(null);
    setSelectedDocumentTitle('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service to continue');
      return;
    }

    if (!privacyAccepted) {
      setError('You must accept the Privacy Policy to continue');
      return;
    }

    setLoading(true);

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
      acceptedTerms: {
        termsOfService: termsAccepted,
        privacyPolicy: privacyAccepted
      }
    };

    const result = await register(userData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" color="primary" fontWeight="bold">
              neibrly
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
              Join your neighbourhood community
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address"
                  label="Address"
                  name="address"
                  autoComplete="street-address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Terms and Privacy Acceptance */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Legal Agreement
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                By creating an account, you agree to our terms and policies:
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I accept the{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleOpenLegalDocument('termsOfService', 'Terms of Service')}
                      sx={{ p: 0, textTransform: 'none', textDecoration: 'underline' }}
                    >
                      Terms of Service
                    </Button>
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I accept the{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleOpenLegalDocument('privacyPolicy', 'Privacy Policy')}
                      sx={{ p: 0, textTransform: 'none', textDecoration: 'underline' }}
                    >
                      Privacy Policy
                    </Button>
                    {' '}(POPIA compliant)
                  </Typography>
                }
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || !termsAccepted || !privacyAccepted}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Legal Document Viewer */}
      <LegalDocumentViewer
        open={legalDocumentOpen}
        onClose={handleCloseLegalDocument}
        documentType={selectedDocumentType}
        title={selectedDocumentTitle}
      />
    </Container>
  );
};

export default Register;