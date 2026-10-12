import { useState } from 'react'
import {
  Button,
  Card,
  Divider,
  FormField,
  Heading,
  Icon,
  InputEmail,
  InputText,
  Text,
  toast,
} from '@/atlantis'
import { useAuth } from '@app/providers/AuthProvider'

export function ProfilePage() {
  const { user } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savedName, setSavedName] = useState(user?.fullName ?? '')
  const [savedEmail, setSavedEmail] = useState(user?.email ?? '')

  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleDiscard = () => {
    setFullName(savedName)
    setEmail(savedEmail)
  }

  const handleSave = () => {
    setSavedName(fullName)
    setSavedEmail(email)
    toast.success('Profile updated')
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={3} className="text-gray-900">Profile</Heading>

      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white">
        <Card.Body>
          <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-semibold shrink-0"
                style={{ backgroundColor: '#1f2d54' }}
              >
                {initials}
              </div>
              <div className="flex flex-col gap-1">
                <Text size="large" className="font-semibold text-gray-900">
                  {user?.fullName ?? 'User'}
                </Text>
                <Text size="base" variation="subdued">{user?.email}</Text>
                <Text size="small" variation="subdued">
                  Role: <span className="capitalize">{user?.role ?? 'Member'}</span>
                </Text>
              </div>
            </div>

            <Divider />

            {/* Personal Information */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="person" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Personal Information
                </Text>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Full Name" required>
                  <InputText
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Enter your full name"
                    prefix="person"
                  />
                </FormField>
                <FormField label="Email Address" required>
                  <InputEmail
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                  />
                </FormField>
              </div>
            </div>

            <Divider />

            {/* Security */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon name="cog" size="base" color="blue" />
                </div>
                <Text size="large" className="text-gray-900 font-semibold">
                  Security
                </Text>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Text size="base" className="font-medium text-gray-900">Password</Text>
                  <Text size="small" variation="subdued">Last changed: Unknown</Text>
                </div>
                <Button
                  type="secondary"
                  label="Change Password"
                  size="small"
                  onClick={() => toast.info('Password change is not available in this version')}
                />
              </div>
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
