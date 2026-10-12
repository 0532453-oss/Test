import { useState, useEffect, useCallback } from 'react';
import { Breadcrumb, BreadcrumbPage } from '@/components/admin';
import {
  Button,
  Card,
  Heading,
  Text,
  List,
  Icon,
  Banner,
  StatusLabel,
  Spinner,
  Page,
} from '../components/atlantis';

// API URL for Stripe Connect endpoints
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Demo technician ID for preview mode
const DEMO_TECHNICIAN_ID = import.meta.env.VITE_TECHNICIAN_ID || 'demo-technician-1';

interface StripeAccountStatus {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
}

interface OnboardingLinkResult {
  accountId: string;
  onboardingUrl: string;
}

export const StripeOnboardingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch current account status
  const fetchAccountStatus = useCallback(async () => {
    setStatusLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/stripe/account/${DEMO_TECHNICIAN_ID}/status`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: StripeAccountStatus = await response.json();
        setAccountStatus(data);
      } else if (response.status === 400) {
        // Technician has not started onboarding yet
        setAccountStatus(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to fetch account status');
      }
    } catch (err) {
      // In demo/preview mode, just show the initial state
      setAccountStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountStatus();
  }, [fetchAccountStatus]);

  // Start Stripe onboarding flow
  const handleStartOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/stripe/onboard/${DEMO_TECHNICIAN_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create onboarding link');
      }

      const data: OnboardingLinkResult = await response.json();

      // Redirect to Stripe-hosted onboarding UI
      window.location.href = data.onboardingUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Continue incomplete onboarding
  const handleContinueOnboarding = async () => {
    await handleStartOnboarding();
  };

  const isOnboardingComplete = accountStatus?.onboardingComplete && accountStatus?.chargesEnabled;
  const hasStartedOnboarding = accountStatus?.accountId != null;
  const needsMoreInfo = hasStartedOnboarding && !isOnboardingComplete;

  return (
    <Page
      title="Payment Setup"
      intro="Connect your Stripe account to receive payments from customers."
    >
      <Breadcrumb>
        <BreadcrumbPage>Stripe Connect Onboarding</BreadcrumbPage>
      </Breadcrumb>

      {error && (
        <Banner type="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Banner>
      )}

      <div className="grid gap-6 max-w-2xl">
        {/* Account Status Card */}
        <Card
          header={{
            title: 'Stripe Account Status',
            action: (
              <Button
                type="tertiary"
                variation="subtle"
                size="small"
                icon="refresh"
                ariaLabel="Refresh account status"
                onClick={fetchAccountStatus}
                disabled={statusLoading}
              />
            ),
          }}
        >
          <Card.Body>
            <div className="flex items-center gap-3 mb-4">
              <Icon name="money" size="large" />
              <div>
                <Heading level={4}>Stripe Account Status</Heading>
                <Text variation="subdued" size="small">
                  Your payment processing account
                </Text>
              </div>
            </div>

            {statusLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="base" ariaLabel="Loading account status" />
              </div>
            ) : isOnboardingComplete ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon name="checkmark" size="base" color="success" />
                  <Text element="span" variation="success" className="font-medium">Account Connected</Text>
                </div>
                <div className="grid gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Account ID</Text>
                    <code className="text-xs bg-[--color-surface--hover] px-2 py-1 rounded">
                      {accountStatus.accountId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Charges</Text>
                    <StatusLabel status="success" alignment="end">
                      Enabled
                    </StatusLabel>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Payouts</Text>
                    <StatusLabel
                      status={accountStatus.payoutsEnabled ? 'success' : 'warning'}
                      alignment="end"
                    >
                      {accountStatus.payoutsEnabled ? 'Enabled' : 'Pending'}
                    </StatusLabel>
                  </div>
                </div>
              </div>
            ) : needsMoreInfo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon name="warning" size="base" color="warning" />
                  <Text element="span" variation="warn" className="font-medium">Additional Information Required</Text>
                </div>
                <Text variation="subdued" size="small">
                  Your Stripe account has been created, but additional information is needed
                  to enable payments.
                </Text>
                <div className="grid gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Account ID</Text>
                    <code className="text-xs bg-[--color-surface--hover] px-2 py-1 rounded">
                      {accountStatus.accountId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Details Submitted</Text>
                    <StatusLabel
                      status={accountStatus.detailsSubmitted ? 'success' : 'warning'}
                      alignment="end"
                    >
                      {accountStatus.detailsSubmitted ? 'Yes' : 'No'}
                    </StatusLabel>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Charges</Text>
                    <StatusLabel
                      status={accountStatus.chargesEnabled ? 'success' : 'critical'}
                      alignment="end"
                    >
                      {accountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                    </StatusLabel>
                  </div>
                </div>
                <Button
                  type="primary"
                  variation="work"
                  fullWidth
                  onClick={handleContinueOnboarding}
                  disabled={loading}
                  loading={loading}
                  icon="external"
                  className="mt-4"
                >
                  {loading ? 'Redirecting...' : 'Continue Setup'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Text variation="subdued" size="small">
                  You haven't connected a Stripe account yet. Connect your account to
                  start accepting payments from customers.
                </Text>
                <List marker="check" gap="base">
                  <List.Item icon="checkmark" iconColor="success">
                    <Text element="span" variation="subdued" size="small">Accept credit card and bank payments</Text>
                  </List.Item>
                  <List.Item icon="checkmark" iconColor="success">
                    <Text element="span" variation="subdued" size="small">Automatic deposits to your bank account</Text>
                  </List.Item>
                  <List.Item icon="checkmark" iconColor="success">
                    <Text element="span" variation="subdued" size="small">Secure, PCI-compliant payment processing</Text>
                  </List.Item>
                </List>
                <Button
                  type="primary"
                  variation="work"
                  fullWidth
                  onClick={handleStartOnboarding}
                  disabled={loading}
                  loading={loading}
                  icon="external"
                  className="mt-4"
                >
                  {loading ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Info Card */}
        <Card header={{ title: 'How it works' }}>
          <Card.Body>
            <List type="ordered" gap="large">
              <List.Item><Text element="span" variation="subdued" size="small">Click the button above to start the Stripe onboarding process</Text></List.Item>
              <List.Item><Text element="span" variation="subdued" size="small">You'll be redirected to Stripe's secure onboarding page</Text></List.Item>
              <List.Item><Text element="span" variation="subdued" size="small">Provide your business and banking information</Text></List.Item>
              <List.Item><Text element="span" variation="subdued" size="small">Once verified, you'll be able to receive customer payments</Text></List.Item>
            </List>
          </Card.Body>
        </Card>
      </div>
    </Page>
  );
};

export default StripeOnboardingPage;
