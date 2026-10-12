import {
  Button,
  Card,
  Divider,
  Heading,
  Icon,
  ProgressBar,
  StatusLabel,
  Text,
  toast,
} from '@/atlantis'

export function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Heading level={3} className="text-gray-900">Billing</Heading>

      {/* Current Plan */}
      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white">
        <Card.Body>
          <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
            {/* Plan Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="payment" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Current Plan
                </Text>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="large" className="font-bold text-gray-900">
                      Free Trial
                    </Text>
                    <StatusLabel label="Active" status="success" />
                  </div>
                  <Text size="base" variation="subdued">
                    Your trial includes all features. Upgrade to keep your data.
                  </Text>
                </div>
                <Button
                  type="primary"
                  label="Upgrade Plan"
                  onClick={() => toast.info('Billing portal is not available in this version')}
                />
              </div>
            </div>

            <Divider />

            {/* Usage */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="barChart" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Usage
                </Text>
              </div>

              <div className="flex flex-col gap-5">
                <UsageRow label="Team Members" used={3} total={5} />
                <UsageRow label="Jobs This Month" used={12} total={50} />
                <UsageRow label="Invoices This Month" used={5} total={20} />
                <UsageRow label="Storage" used={45} total={500} unit="MB" />
              </div>
            </div>

            <Divider />

            {/* Billing Portal */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="externalLink" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Billing Portal
                </Text>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text size="base" className="font-medium text-gray-900">
                      Payment Method
                    </Text>
                    <Text size="small" variation="subdued">
                      No payment method on file
                    </Text>
                  </div>
                  <Button
                    type="secondary"
                    label="Add Payment Method"
                    size="small"
                    onClick={() => toast.info('Payment method setup is not available in this version')}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text size="base" className="font-medium text-gray-900">
                      Billing History
                    </Text>
                    <Text size="small" variation="subdued">
                      View past invoices and receipts
                    </Text>
                  </div>
                  <Button
                    type="secondary"
                    label="View History"
                    size="small"
                    onClick={() => toast.info('Billing history is not available in this version')}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

function UsageRow({
  label,
  used,
  total,
  unit,
}: {
  label: string
  used: number
  total: number
  unit?: string
}) {
  const percent = Math.round((used / total) * 100)
  const displayUnit = unit ?? ''

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Text size="base" className="font-medium text-gray-900">{label}</Text>
        <Text size="small" variation="subdued">
          {used}{displayUnit} / {total}{displayUnit}
        </Text>
      </div>
      <ProgressBar
        currentStep={percent}
        totalSteps={100}
        size="small"
      />
    </div>
  )
}
