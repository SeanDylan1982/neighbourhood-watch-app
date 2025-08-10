import React from 'react';
import { Typography, Box } from '@mui/material';
import {
  Report as ReportIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '../Common/WelcomeMessage';

const ReportsWelcomeMessage = ({ onCreateReport }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Create a Report',
      icon: <AddIcon />,
      onClick: onCreateReport || (() => {
        // Trigger FAB or create report dialog
        const fab = document.querySelector('[data-testid="create-report-fab"]');
        if (fab) {
          fab.click();
        }
      }),
      variant: 'contained'
    },
    {
      label: 'Emergency Contacts',
      icon: <PhoneIcon />,
      onClick: () => navigate('/contacts?tab=emergency'),
      color: 'error'
    }
  ];

  return (
    <WelcomeMessage
      type="reports"
      title="Welcome to Community Reports"
      severity="warning"
      icon={ReportIcon}
      actions={actions}
    >
      <Box>
        <Typography variant="body2" paragraph>
          The Reports section helps keep our neighborhood safe by allowing residents to report incidents, suspicious activities, and safety concerns.
        </Typography>
        
        <Typography variant="body2" paragraph>
          <strong>⚠️ For immediate emergencies, always call 911 first!</strong>
        </Typography>

        <Typography variant="body2" paragraph>
          <strong>What to report:</strong>
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="body2">
              Suspicious activities or behavior
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Property damage or vandalism
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Safety hazards (broken streetlights, potholes, etc.)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Noise complaints or disturbances
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Lost or stray animals
            </Typography>
          </li>
        </Box>

        <Typography variant="body2" paragraph>
          <strong>Reporting Guidelines:</strong>
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="body2">
              Provide accurate and factual information
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Include date, time, and location details
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Add photos or videos if available and safe to do so
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Respect privacy and avoid speculation
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Reports may be shared with local authorities if necessary
            </Typography>
          </li>
        </Box>

        <Typography variant="body2">
          Your reports help create a safer community for everyone. Thank you for being vigilant and caring about our neighborhood's wellbeing.
        </Typography>
      </Box>
    </WelcomeMessage>
  );
};

export default ReportsWelcomeMessage;