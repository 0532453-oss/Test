import { useState } from 'react'
import { useGetList } from 'ra-core'
import {
  Button,
  Card,
  Heading,
  Icon,
  InputText,
  Modal,
  FormField,
  InputEmail,
  Select,
  StatusLabel,
  Text,
  toast,
} from '@/atlantis'
import type { TeamMember } from '@/types'

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'TECHNICIAN', label: 'Technician' },
]

const roleSemantic: Record<string, 'informative' | 'warning' | 'success'> = {
  ADMIN: 'informative',
  DISPATCHER: 'warning',
  TECHNICIAN: 'success',
}

export function TeamPage() {
  const { data: members = [], isLoading } = useGetList<TeamMember>('teamMembers', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  })

  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('TECHNICIAN')

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  )

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }
    toast.success(`Invitation sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviteRole('TECHNICIAN')
    setShowInviteModal(false)
  }

  const handleRemove = (member: TeamMember) => {
    toast.info(`Removing ${member.name} is not available in this version`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={3} className="text-gray-900">Team</Heading>
        <Button
          type="primary"
          label="Invite Member"
          size="small"
          icon="add"
          onClick={() => setShowInviteModal(true)}
        />
      </div>

      {/* Search */}
      <InputText
        value={search}
        onChange={setSearch}
        placeholder="Search team members..."
        prefix="search"
      />

      {/* Members list */}
      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white">
        <Card.Body>
          <div className="divide-y divide-gray-100">
            {isLoading && (
              <div className="p-8 text-center">
                <Text variation="subdued">Loading team members...</Text>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="p-8 text-center">
                <Icon name="clients" size="large" color="greyBlue" />
                <Text variation="subdued" className="mt-2">
                  {search ? 'No team members match your search' : 'No team members yet'}
                </Text>
              </div>
            )}

            {filtered.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 sm:px-6 py-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                    style={{ backgroundColor: member.color ?? '#1f2d54' }}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Text size="base" className="font-medium text-gray-900 truncate">
                      {member.name}
                    </Text>
                    <Text size="small" variation="subdued" className="truncate">
                      {member.email}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusLabel
                    label={member.role}
                    status={roleSemantic[member.role] ?? 'informative'}
                  />
                  <StatusLabel
                    label={member.isActive ? 'Active' : 'Inactive'}
                    status={member.isActive ? 'success' : 'inactive'}
                  />
                  <Button
                    type="tertiary"
                    label="Remove"
                    size="small"
                    variation="destructive"
                    onClick={() => handleRemove(member)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal
          title="Invite Team Member"
          open={showInviteModal}
          onRequestClose={() => setShowInviteModal(false)}
          primaryAction={{ label: 'Send Invite', onClick: handleInvite }}
          secondaryAction={{ label: 'Cancel', onClick: () => setShowInviteModal(false) }}
        >
          <div className="flex flex-col gap-4 p-4">
            <FormField label="Email Address" required>
              <InputEmail
                value={inviteEmail}
                onChange={setInviteEmail}
                placeholder="name@example.com"
              />
            </FormField>
            <FormField label="Role">
              <Select
                value={inviteRole}
                onChange={(v) => setInviteRole(String(v ?? 'TECHNICIAN'))}
                options={roleOptions}
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  )
}
