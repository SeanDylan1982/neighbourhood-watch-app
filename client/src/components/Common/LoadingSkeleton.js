import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  Typography
} from '@mui/material';

// Generic loading skeleton for cards
export const CardSkeleton = ({ count = 3 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} md={6} key={index}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="rectangular" width={60} height={20} sx={{ mr: 1 }} />
              <Skeleton variant="rectangular" width={40} height={20} />
            </Box>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
            <Skeleton variant="text" sx={{ mb: 2 }} />
            <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={120} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Loading skeleton for dashboard stats
export const StatsSkeleton = () => (
  <Grid container spacing={3}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" sx={{ fontSize: '2rem' }} width={60} />
              </Box>
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Loading skeleton for list items
export const ListSkeleton = ({ count = 5 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
          <Skeleton variant="text" width="70%" />
        </Box>
        <Skeleton variant="rectangular" width={60} height={20} />
      </Box>
    ))}
  </Box>
);

// Loading skeleton for profile
export const ProfileSkeleton = () => (
  <Box>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Skeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Skeleton variant="rectangular" width={80} height={24} />
              <Skeleton variant="rectangular" width={60} height={24} />
            </Box>
            <Skeleton variant="text" width="80%" />
          </Box>
          <Skeleton variant="rectangular" width={100} height={36} />
        </Box>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent>
        <Skeleton variant="text" sx={{ fontSize: '1.25rem', mb: 3 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
                <Skeleton variant="text" />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  </Box>
);

// Loading skeleton for chat
export const ChatSkeleton = () => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: '1.25rem', mb: 2 }} />
          <ListSkeleton count={3} />
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={8}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: '1.25rem', mb: 2 }} />
          <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end' 
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  width={200} 
                  height={40} 
                  sx={{ borderRadius: 2 }} 
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

// Generic loading component
export const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: 200,
      gap: 2
    }}
  >
    <Skeleton variant="circular" width={size} height={size} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Loading skeleton for forms
export const FormSkeleton = ({ fields = 3 }) => (
  <Box>
    {Array.from({ length: fields }).map((_, index) => (
      <Box key={index} sx={{ mb: 3 }}>
        <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={56} />
      </Box>
    ))}
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
      <Skeleton variant="rectangular" width={80} height={36} />
      <Skeleton variant="rectangular" width={100} height={36} />
    </Box>
  </Box>
);

// Loading skeleton for tables
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {/* Table Header */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2, bgcolor: 'grey.50' }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width={120} height={20} />
      ))}
    </Box>
    
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1, p: 2 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width={120} height={20} />
        ))}
      </Box>
    ))}
  </Box>
);

// Loading skeleton for media grid
export const MediaGridSkeleton = ({ count = 6 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={6} sm={4} md={3} key={index}>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
      </Grid>
    ))}
  </Grid>
);

const LoadingSkeletons = {
  CardSkeleton,
  StatsSkeleton,
  ListSkeleton,
  ProfileSkeleton,
  ChatSkeleton,
  LoadingSpinner,
  FormSkeleton,
  TableSkeleton,
  MediaGridSkeleton
};

export default LoadingSkeletons;