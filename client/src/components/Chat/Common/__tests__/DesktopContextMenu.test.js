import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Delete as DeleteIcon } from '@mui/icons-material';
import DesktopContextMenu from '../DesktopContextMenu';

// Mock useDesktopFeatures
jest.mock('../../../../hooks/useResponsive', () => ({
  useDesktopFeatures: () => ({
    features: {
      rightClickMenus: true
    }
  })
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DesktopContextMenu', () => {
  const mockOnAction = jest.fn();
  
  const defaultMenuItems = [
    {
      id: 'delete',
      label: 'Delete',
      action: 'delete',
      icon: <DeleteIcon />,
      danger: true
    },
    {
      type: 'divider'
    },
    {
      id: 'info',
      label: 'Info',
      action: 'info',
      description: 'View details'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children correctly', () => {
    renderWithTheme(
      <DesktopContextMenu menuItems={defaultMenuItems} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show context menu on right click', async () => {
    renderWithTheme(
      <DesktopContextMenu menuItems={defaultMenuItems} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  it('should call onAction when menu item is clicked', async () => {
    renderWithTheme(
      <DesktopContextMenu menuItems={defaultMenuItems} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(mockOnAction).toHaveBeenCalledWith('delete', undefined);
  });

  it('should close menu on escape key', async () => {
    renderWithTheme(
      <DesktopContextMenu menuItems={defaultMenuItems} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  it('should not show menu when disabled', () => {
    renderWithTheme(
      <DesktopContextMenu 
        menuItems={defaultMenuItems} 
        onAction={mockOnAction}
        disabled={true}
      >
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should render menu items with icons and descriptions', async () => {
    renderWithTheme(
      <DesktopContextMenu menuItems={defaultMenuItems} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('View details')).toBeInTheDocument();
    });
  });

  it('should handle header type menu items', async () => {
    const menuItemsWithHeader = [
      {
        type: 'header',
        label: 'Actions'
      },
      ...defaultMenuItems
    ];

    renderWithTheme(
      <DesktopContextMenu menuItems={menuItemsWithHeader} onAction={mockOnAction}>
        <div>Test Content</div>
      </DesktopContextMenu>
    );

    const content = screen.getByText('Test Content');
    fireEvent.contextMenu(content, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});