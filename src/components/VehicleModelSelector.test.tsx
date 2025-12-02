import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleModelSelector } from './VehicleModelSelector';
import { VehicleModel } from '@/types';

describe('VehicleModelSelector', () => {
  it('should render all 5 vehicle model options (Requirement 1.2)', () => {
    const onChange = vi.fn();
    render(<VehicleModelSelector value={null} onChange={onChange} />);

    // Verify all 5 options are present
    expect(screen.getByText('Cavalo 6x4')).toBeInTheDocument();
    expect(screen.getByText('Cavalo 6x2')).toBeInTheDocument();
    expect(screen.getByText('Carreta Rodotrem 9 Eixos')).toBeInTheDocument();
    expect(screen.getByText('Carreta Rodotrem Graneleiro')).toBeInTheDocument();
    expect(screen.getByText('Livre')).toBeInTheDocument();
  });

  it('should display required field indicator', () => {
    const onChange = vi.fn();
    render(<VehicleModelSelector value={null} onChange={onChange} />);

    // Check for required field indicator (*)
    expect(screen.getByText(/Modelo de Vistoria Guiada \*/)).toBeInTheDocument();
  });

  it('should call onChange when a model is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    
    render(<VehicleModelSelector value={null} onChange={onChange} />);

    // Click on Cavalo 6x4 option
    const cavalo6x4Radio = screen.getByRole('radio', { name: /Cavalo 6x4/i });
    await user.click(cavalo6x4Radio);

    expect(onChange).toHaveBeenCalledWith(VehicleModel.CAVALO_6X4);
  });

  it('should display error message when provided', () => {
    const onChange = vi.fn();
    const errorMessage = 'Selecione o modelo de vistoria guiada';
    
    render(
      <VehicleModelSelector 
        value={null} 
        onChange={onChange} 
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    
    render(
      <VehicleModelSelector 
        value={null} 
        onChange={onChange} 
        disabled={true}
      />
    );

    // All radio buttons should be disabled
    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  it('should show selected value', () => {
    const onChange = vi.fn();
    
    render(
      <VehicleModelSelector 
        value={VehicleModel.CAVALO_6X4} 
        onChange={onChange}
      />
    );

    const cavalo6x4Radio = screen.getByRole('radio', { name: /Cavalo 6x4/i });
    expect(cavalo6x4Radio).toBeChecked();
  });
});
