import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PinIcon from './PinIcon';

// Create a theme for testing
const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PinIcon Component', () => {
  test('renders pin icon with default props', () => {
    renderWithTheme(<PinIcon />);
    
    // Check if the pin icon is rendered (FluentIcon with name "Pin")
    const pinElement = screen.getByRole('img', { hidden: true });
    expect(pinElement).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    renderWithTheme(<PinIcon size={24} />);
    
    const pinElement = screen.getByRole('img', { hidden: true });
    expect(pinElement).toBeInTheDocument();
  });

  test('renders with tooltip by default', () => {
    renderWithTheme(<PinIcon />);
    
    // Check if tooltip is present
    expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
  });

  test('renders with custom tooltip text', () => {
    renderWithTheme(<PinIcon tooltip="Custom pin message" />);
    
    expect(screen.getByLabelText('Custom pin message')).toBeInTheDocument();
  });

  test('renders without tooltip when showTooltip is false', () => {
    renderWithTheme(<PinIcon showTooltip={false} />);
    
    // Should not have tooltip
    expect(screen.queryByLabelText('Pinned')).not.toBeInTheDocument();
  });

  test('applies absolute positioning when specified', () => {
    const { container } = renderWithTheme(<PinIcon position="absolute" />);
    
    const pinContainer = container.firstChild;
    expect(pinContainer).toHaveStyle('position: absolute');
  });

  test('applies custom styles', () => {
    const customStyles = { marginLeft: '10px' };
    const { container } = renderWithTheme(<PinIcon sx={customStyles} />);
    
    const pinContainer = container.firstChild;
    expect(pinContainer).toHaveStyle('margin-left: 10px');
  });
});