import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CSpinner,
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch } from '@coreui/icons'
import { PageHeader, EmptyState } from '@shared/components'
import { ROUTES } from '@app/routes'
import { useJobs } from '../hooks'
import { JobCard } from '../components'
import type { JobFilters } from '../types'

export default function JobList() {
  const [filters, setFilters] = useState<JobFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const { data: jobs, isLoading, error } = useJobs(filters)

  // Client-side filtering for search (backend does not support search param)
  const filteredJobs = jobs?.filter((job) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      job.title.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query)
    )
  })

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Manage and track all service jobs"
        actions={
          <CButton color="primary" as={Link} to={ROUTES.JOB_CREATE}>
            <CIcon icon={cilPlus} className="me-2" />
            New Job
          </CButton>
        }
      />

      <CCard className="mb-4">
        <CCardBody>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CInputGroup>
        </CCardBody>
      </CCard>

      {isLoading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load jobs"
          description="There was an error loading your jobs. Please try again."
          action={
            <CButton color="primary" onClick={() => window.location.reload()}>
              Retry
            </CButton>
          }
        />
      ) : !filteredJobs?.length ? (
        <EmptyState
          title="No jobs found"
          description="Get started by creating your first job."
          action={
            <CButton color="primary" as={Link} to={ROUTES.JOB_CREATE}>
              <CIcon icon={cilPlus} className="me-2" />
              Create Job
            </CButton>
          }
        />
      ) : (
        <CRow>
          {filteredJobs.map((job) => (
            <CCol key={job.id} sm={6} lg={4}>
              <JobCard job={job} />
            </CCol>
          ))}
        </CRow>
      )}
    </>
  )
}
