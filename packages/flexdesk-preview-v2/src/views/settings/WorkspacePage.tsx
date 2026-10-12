import { useState } from 'react'
import {
  Button,
  Card,
  Divider,
  FormField,
  Heading,
  Icon,
  InputText,
  Text,
  toast,
} from '@/atlantis'
import { useAuth } from '@app/providers/AuthProvider'

export function WorkspacePage() {
  const { user } = useAuth()

  const [workspaceName, setWorkspaceName] = useState('My Workspace')
  const [subdomain, setSubdomain] = useState('my-workspace')
  const [timezone, setTimezone] = useState('America/New_York')
  const [savedData, setSavedData] = useState({ workspaceName: 'My Workspace', subdomain: 'my-workspace', timezone: 'America/New_York' })

  const handleDiscard = () => {
    setWorkspaceName(savedData.workspaceName)
    setSubdomain(savedData.subdomain)
    setTimezone(savedData.timezone)
  }

  const handleSave = () => {
    setSavedData({ workspaceName, subdomain, timezone })
    toast.success('Workspace settings saved')
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={3} className="text-gray-900">Workspace</Heading>

      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white">
        <Card.Body>
          <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
            {/* General */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="building" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  General
                </Text>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Workspace Name" required>
                  <InputText
                    value={workspaceName}
                    onChange={setWorkspaceName}
                    placeholder="Enter workspace name"
                    prefix="building"
                  />
                </FormField>
                <FormField label="Subdomain">
                  <InputText
                    value={subdomain}
                    onChange={setSubdomain}
                    placeholder="my-workspace"
                    prefix="link"
                  />
                </FormField>
              </div>
            </div>

            <Divider />

            {/* Workspace Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="info" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Workspace Info
                </Text>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text size="base" className="font-medium text-gray-900">Workspace ID</Text>
                    <Text size="small" variation="subdued">{user?.workspaceId ?? 'N/A'}</Text>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text size="base" className="font-medium text-gray-900">Timezone</Text>
                    <Text size="small" variation="subdued">{timezone}</Text>
                  </div>
                  <Button
                    type="secondary"
                    label="Change"
                    size="small"
                    onClick={() => toast.info('Timezone changes are not available in this version')}
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Danger Zone */}
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <Icon name="alert" size="base" color="red" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Danger Zone
                </Text>
              </div>
              <Text size="base" variation="subdued" className="mb-4">
                Deleting your workspace is permanent and cannot be undone. All data will be lost.
              </Text>
              <Button
                type="secondary"
                variation="destructive"
                label="Delete Workspace"
                size="small"
                onClick={() => toast.info('Workspace deletion is not available in this version')}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          type="secondary"
          label="Discard Changes"
          fullWidth
          onClick={handleDiscard}
        />
        <Button
          type="primary"
          label="Save Changes"
          fullWidth
          onClick={handleSave}
        />
      </div>
    </div>
  )
}
