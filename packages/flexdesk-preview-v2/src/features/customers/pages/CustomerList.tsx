import { Link } from 'react-router-dom'
import { CButton, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { PageHeader, EmptyState } from '@shared/components'
import { ROUTES } from '@app/routes'

export default function CustomerList() {
  // TODO: Replace with useCustomers hook
  const customers: unknown[] = []
  const isLoading = false

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        actions={
          <CButton color="primary" as={Link} to={ROUTES.CUSTOMER_CREATE}>
            <CIcon icon={cilPlus} className="me-2" />
            New Customer
          </CButton>
        }
      />

      {isLoading ? (
        <CCard>
          <CCardBody className="text-center py-5">Loading...</CCardBody>
        </CCard>
      ) : !customers.length ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to get started."
          action={
            <CButton color="primary" as={Link} to={ROUTES.CUSTOMER_CREATE}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Customer
            </CButton>
          }
        />
      ) : (
        <CCard>
          <CCardBody>Customer list table will go here</CCardBody>
        </CCard>
      )}
    </>
  )
}
