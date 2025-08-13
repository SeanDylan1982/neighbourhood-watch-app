import React from 'react';
import { Box, Button, Typography, Stack, Divider } from '@mui/material';
import { useToast } from '../Common/Toast';
import toastTestUtils from '../../utils/toastTestUtils';

const ToastTest = () => {
  const { showToast } = useToast();

  const testToasts = [
    {
      label: 'Success Toast',
      action: () => showToast('Operation completed successfully!', 'success'),
      color: 'success'
    },
    {
      label: 'Error Toast',
      action: () => showToast('Something went wrong. Please try again.', 'error'),
      color: 'error'
    },
    {
      label: 'Warning Toast',
      action: () => showToast('Please review your input before proceeding.', 'warning'),
      color: 'warning'
    },
    {
      label: 'Info Toast',
      action: () => showToast('Here is some helpful information.', 'info'),
      color: 'info'
    },
    {
      label: 'Long Message Toast',
      action: () => showToast('This is a very long toast message that should wrap properly and display all the content without any issues. It should be readable and well-formatted.', 'info'),
      color: 'primary'
    },
    {
      label: 'Object Format Toast',
      action: () => showToast({
        message: 'This toast uses object format with custom duration',
        type: 'success',
        duration: 8000
      }),
      color: 'secondary'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Toast Notification Test
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click the buttons below to test different types of toast notifications.
        They should appear in the top-right corner of the screen.
      </Typography>
      
      <Stack spacing={2} direction="column" sx={{ maxWidth: 400 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Basic Toast Types
        </Typography>
        <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
          {testToasts.slice(0, 4).map((test, index) => (
            <Button
              key={index}
              variant="contained"
              color={test.color}
              onClick={test.action}
              size="small"
            >
              {test.label}
            </Button>
          ))}
        </Stack>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Advanced Tests
        </Typography>
        <Stack spacing={1}>
          {testToasts.slice(4).map((test, index) => (
            <Button
              key={index + 4}
              variant="outlined"
              color={test.color}
              onClick={test.action}
              fullWidth
            >
              {test.label}
            </Button>
          ))}
        </Stack>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Test Scenarios
        </Typography>
        <Stack spacing={1}>
          <Button
            variant="outlined"
            onClick={() => toastTestUtils.testToastFormats(showToast)}
            fullWidth
          >
            Test All Formats
          </Button>
          <Button
            variant="outlined"
            onClick={() => toastTestUtils.testToastPositioning(showToast)}
            fullWidth
          >
            Test Positioning & Stacking
          </Button>
          <Button
            variant="outlined"
            onClick={() => toastTestUtils.testToastDismissal(showToast)}
            fullWidth
          >
            Test Dismissal Behavior
          </Button>
          <Button
            variant="outlined"
            onClick={() => toastTestUtils.testContentModerationToasts(showToast)}
            fullWidth
          >
            Test Content Moderation Toasts
          </Button>
        </Stack>
      </Stack>
      
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Expected Behavior:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li>Toasts should slide in from the right</li>
          <li>Multiple toasts should stack vertically</li>
          <li>Toasts should auto-dismiss after 5 seconds (8 seconds for custom duration)</li>
          <li>Clicking the X button should dismiss immediately</li>
          <li>Different types should have different colors and icons</li>
        </Typography>
      </Box>
    </Box>
  );
};

export default ToastTest;