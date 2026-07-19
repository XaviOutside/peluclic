/**
 * Tests for DateTimePicker component.
 * Native <input type="date"> + <select> with 30-min slots.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DateTimePicker from './DateTimePicker';

describe('DateTimePicker', () => {
  const defaultProps = {
    date: '',
    time: '',
    onDateChange: vi.fn(),
    onTimeChange: vi.fn(),
  };

  it('renders a date input and time select', () => {
    render(<DateTimePicker {...defaultProps} />);

    const dateInput = screen.getByLabelText(/date/i);
    const timeSelect = screen.getByLabelText(/time/i);

    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
    expect(timeSelect).toBeInTheDocument();
    expect(timeSelect.tagName).toBe('SELECT');
  });

  it('renders time options from default business hours (08:00–18:00, 30-min slots)', () => {
    render(<DateTimePicker {...defaultProps} />);

    const timeSelect = screen.getByLabelText(/time/i);
    const options = timeSelect.querySelectorAll('option');

    // First option is the placeholder, then 08:00, 08:30, ..., 18:00 = 21 slots + 1 placeholder
    expect(options.length).toBeGreaterThanOrEqual(20);

    // Check specific slots exist
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('accepts custom work start/end times', () => {
    render(
      <DateTimePicker
        {...defaultProps}
        workStartTime="09:00"
        workEndTime="17:00"
      />,
    );

    const timeSelect = screen.getByLabelText(/time/i);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('17:00')).toBeInTheDocument();

    // Should NOT include 08:00 or 18:00
    expect(screen.queryByText('08:00')).not.toBeInTheDocument();
    expect(screen.queryByText('18:00')).not.toBeInTheDocument();
  });

  it('calls onDateChange when date input changes', () => {
    const onDateChange = vi.fn();
    render(
      <DateTimePicker {...defaultProps} onDateChange={onDateChange} />,
    );

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2026-07-20' } });

    expect(onDateChange).toHaveBeenCalledWith('2026-07-20');
  });

  it('calls onTimeChange when time select changes', () => {
    const onTimeChange = vi.fn();
    render(
      <DateTimePicker {...defaultProps} onTimeChange={onTimeChange} />,
    );

    const timeSelect = screen.getByLabelText(/time/i);
    fireEvent.change(timeSelect, { target: { value: '10:30' } });

    expect(onTimeChange).toHaveBeenCalledWith('10:30');
  });

  it('displays controlled values', () => {
    render(
      <DateTimePicker
        date="2026-07-22"
        time="14:00"
        onDateChange={vi.fn()}
        onTimeChange={vi.fn()}
      />,
    );

    const dateInput = screen.getByLabelText(/date/i);
    const timeSelect = screen.getByLabelText(/time/i);

    expect(dateInput).toHaveValue('2026-07-22');
    expect(timeSelect).toHaveValue('14:00');
  });
});
