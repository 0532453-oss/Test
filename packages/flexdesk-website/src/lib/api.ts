const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '')}/api/v1`;

interface CreateCheckoutSessionParams {
  tierId: string;
  interval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
  email?: string;
}

interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResponse> {
  const response = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create checkout session' }));
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}
