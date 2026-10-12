import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechnicianCard } from './TechnicianCard';
import type { Technician, NextJobInfo, NoNextJobInfo } from '../types/Technician';

const baseTechnician: Technician = {
  id: 'tech-1',
  userId: 'user-1',
  phone: '555-1234',
  licenseNumber: 'LIC-001',
  specialties: ['HVAC', 'Plumbing'],
  isAvailable: true,
  firstName: 'John',
  lastName: 'Doe',
  currentLocation: null,
};

const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

const baseNextJob: NextJobInfo = {
  jobId: 'job-1',
  customerName: 'Jane Smith',
  title: 'Fix AC Unit',
  address: '456 Oak Ave',
  scheduledAt: futureDate,
  minutesUntilStart: 60,
  directionsUrl: 'https://maps.google.com/directions',
  hasJobInProgress: false,
  travelTimeMinutes: 15,
};

describe('TechnicianCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the technician full name', () => {
    render(<TechnicianCard technician={baseTechnician} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows "Unknown" when name fields are empty', () => {
    const tech = { ...baseTechnician, firstName: undefined, lastName: undefined };
    render(<TechnicianCard technician={tech} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders availability badge as Available', () => {
    render(<TechnicianCard technician={baseTechnician} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders availability badge as Unavailable', () => {
    const tech = { ...baseTechnician, isAvailable: false };
    render(<TechnicianCard technician={tech} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('renders phone number', () => {
    render(<TechnicianCard technician={baseTechnician} />);
    expect(screen.getByText('Phone: 555-1234')).toBeInTheDocument();
  });

  it('does not render phone when null', () => {
    const tech = { ...baseTechnician, phone: null };
    render(<TechnicianCard technician={tech} />);
    expect(screen.queryByText(/Phone:/)).not.toBeInTheDocument();
  });

  it('renders specialties', () => {
    render(<TechnicianCard technician={baseTechnician} />);
    expect(screen.getByText('HVAC')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
  });

  it('does not render specialties section when empty', () => {
    const tech = { ...baseTechnician, specialties: [] };
    render(<TechnicianCard technician={tech} />);
    expect(screen.queryByText('HVAC')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TechnicianCard technician={baseTechnician} onClick={handleClick} />);

    await user.click(screen.getByText('John Doe'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders next job info when provided', () => {
    render(
      <TechnicianCard technician={baseTechnician} nextJob={baseNextJob} />,
    );
    expect(screen.getByText('Fix AC Unit')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    expect(screen.getByText('Next Job')).toBeInTheDocument();
  });

  it('renders travel time when available', () => {
    render(
      <TechnicianCard technician={baseTechnician} nextJob={baseNextJob} />,
    );
    expect(screen.getByText('Travel time: ~15 min')).toBeInTheDocument();
  });

  it('renders Get Directions button when directionsUrl exists', () => {
    render(
      <TechnicianCard technician={baseTechnician} nextJob={baseNextJob} />,
    );
    expect(screen.getByText('Get Directions')).toBeInTheDocument();
  });

  it('calls onGetDirections callback when directions button is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const handleDirections = vi.fn();
    render(
      <TechnicianCard
        technician={baseTechnician}
        nextJob={baseNextJob}
        onGetDirections={handleDirections}
      />,
    );

    await user.click(screen.getByText('Get Directions'));
    expect(handleDirections).toHaveBeenCalledWith(
      'https://maps.google.com/directions',
    );
  });

  it('opens window when Get Directions is clicked without onGetDirections', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <TechnicianCard technician={baseTechnician} nextJob={baseNextJob} />,
    );

    await user.click(screen.getByText('Get Directions'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://maps.google.com/directions',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('hides next job section when showNextJob is false', () => {
    render(
      <TechnicianCard
        technician={baseTechnician}
        nextJob={baseNextJob}
        showNextJob={false}
      />,
    );
    expect(screen.queryByText('Next Job')).not.toBeInTheDocument();
    expect(screen.queryByText('Fix AC Unit')).not.toBeInTheDocument();
  });

  it('renders "In Progress" badge when hasJobInProgress is true', () => {
    const nextJob: NextJobInfo = { ...baseNextJob, hasJobInProgress: true };
    render(
      <TechnicianCard technician={baseTechnician} nextJob={nextJob} />,
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders no-next-job message when NoNextJobInfo is provided', () => {
    const noJob: NoNextJobInfo = {
      hasNextJob: false,
      message: 'No upcoming jobs',
      hasJobInProgress: false,
    };
    render(
      <TechnicianCard technician={baseTechnician} nextJob={noJob} />,
    );
    expect(screen.getByText('No upcoming jobs')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TechnicianCard technician={baseTechnician} className="my-custom" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('my-custom');
  });
});
