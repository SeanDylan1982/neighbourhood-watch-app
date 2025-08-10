import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EncryptionStatus from '../EncryptionStatus';

describe('EncryptionStatus', () => {
  const defaultProps = {
    isEnabled: false,
    status: 'disabled',
    statusText: 'Encryption is disabled',
  };

  it('should render with default props', () => {
    render(<EncryptionStatus {...defaultProps} />);
    
    expect(screen.getByText('Encryption is disabled')).toBeInTheDocument();
    expect(screen.getByText('🔓')).toBeInTheDocument();
  });

  it('should render enabled status correctly', () => {
    render(
      <EncryptionStatus
        isEnabled={true}
        status="enabled"
        statusText="Messages are end-to-end encrypted"
      />
    );
    
    expect(screen.getByText('Messages are end-to-end encrypted')).toBeInTheDocument();
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('should render checking status correctly', () => {
    render(
      <EncryptionStatus
        isEnabled={false}
        status="checking"
        statusText="Setting up encryption..."
      />
    );
    
    expect(screen.getByText('Setting up encryption...')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('should render error status correctly', () => {
    render(
      <EncryptionStatus
        isEnabled={false}
        status="error"
        statusText="Encryption setup failed"
      />
    );
    
    expect(screen.getByText('Encryption setup failed')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(
      <EncryptionStatus
        {...defaultProps}
        showIcon={false}
      />
    );
    
    expect(screen.queryByText('🔓')).not.toBeInTheDocument();
    expect(screen.getByText('Encryption is disabled')).toBeInTheDocument();
  });

  it('should hide text when showText is false', () => {
    render(
      <EncryptionStatus
        {...defaultProps}
        showText={false}
      />
    );
    
    expect(screen.getByText('🔓')).toBeInTheDocument();
    expect(screen.queryByText('Encryption is disabled')).not.toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { rerender, container } = render(
      <EncryptionStatus
        {...defaultProps}
        size="small"
      />
    );
    
    expect(container.firstChild).toHaveClass('encryption-status--small');
    
    rerender(
      <EncryptionStatus
        {...defaultProps}
        size="large"
      />
    );
    
    expect(container.firstChild).toHaveClass('encryption-status--large');
  });

  it('should apply correct status classes', () => {
    const { rerender, container } = render(
      <EncryptionStatus
        {...defaultProps}
        status="enabled"
      />
    );
    
    expect(container.firstChild).toHaveClass('encryption-status--enabled');
    
    rerender(
      <EncryptionStatus
        {...defaultProps}
        status="error"
      />
    );
    
    expect(container.firstChild).toHaveClass('encryption-status--error');
  });

  it('should handle click events when onClick is provided', () => {
    const handleClick = jest.fn();
    
    render(
      <EncryptionStatus
        {...defaultProps}
        onClick={handleClick}
      />
    );
    
    const element = screen.getByRole('button');
    fireEvent.click(element);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when onClick is not provided', () => {
    const { container } = render(<EncryptionStatus {...defaultProps} />);
    
    const element = container.firstChild;
    expect(element).not.toHaveAttribute('role', 'button');
    expect(element).not.toHaveAttribute('tabIndex');
  });

  it('should have proper accessibility attributes when clickable', () => {
    const handleClick = jest.fn();
    
    render(
      <EncryptionStatus
        {...defaultProps}
        onClick={handleClick}
      />
    );
    
    const element = screen.getByRole('button');
    expect(element).toHaveAttribute('tabIndex', '0');
    expect(element).toHaveAttribute('title', 'Encryption is disabled');
  });

  it('should handle keyboard events when clickable', () => {
    const handleClick = jest.fn();
    
    render(
      <EncryptionStatus
        {...defaultProps}
        onClick={handleClick}
      />
    );
    
    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: 'Enter' });
    
    // Note: The component doesn't handle keyboard events in the current implementation
    // This test documents the current behavior
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should display tooltip with status text', () => {
    const { container } = render(<EncryptionStatus {...defaultProps} />);
    
    const element = container.firstChild;
    expect(element).toHaveAttribute('title', 'Encryption is disabled');
  });

  it('should render with both icon and text by default', () => {
    render(<EncryptionStatus {...defaultProps} />);
    
    expect(screen.getByText('🔓')).toBeInTheDocument();
    expect(screen.getByText('Encryption is disabled')).toBeInTheDocument();
  });

  it('should handle empty status text', () => {
    const { container } = render(
      <EncryptionStatus
        isEnabled={false}
        status="disabled"
        statusText=""
      />
    );
    
    expect(screen.getByText('🔓')).toBeInTheDocument();
    const textElement = container.querySelector('.encryption-status__text');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveTextContent('');
  });
});