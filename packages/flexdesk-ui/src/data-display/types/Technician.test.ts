import { describe, it, expect } from 'vitest';
import { hasNextJob } from './Technician';
import type { NextJobInfo, NoNextJobInfo } from './Technician';

describe('hasNextJob', () => {
  it('returns true for NextJobInfo (has jobId)', () => {
    const info: NextJobInfo = {
      jobId: 'job-1',
      customerName: 'Test',
      title: 'Test Job',
      scheduledAt: '2025-03-15T09:00:00Z',
      minutesUntilStart: 60,
      directionsUrl: 'https://maps.google.com',
      hasJobInProgress: false,
    };
    expect(hasNextJob(info)).toBe(true);
  });

  it('returns false for NoNextJobInfo (no jobId)', () => {
    const info: NoNextJobInfo = {
      hasNextJob: false,
      message: 'No upcoming jobs',
      hasJobInProgress: false,
    };
    expect(hasNextJob(info)).toBe(false);
  });
});
