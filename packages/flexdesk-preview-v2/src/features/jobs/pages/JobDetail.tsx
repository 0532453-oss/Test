import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilArrowLeft,
  cilLocationPin,
  cilCalendar,
  cilClock,
  cilInfo,
  cilCheckCircle,
  cilReload,
  cilNotes,
} from '@coreui/icons'
import { format } from 'date-fns'
import { PageHeader, EmptyState } from '@shared/components'
import { ROUTES, routes } from '@app/routes'
import { useJob } from '../hooks'
import { JobStatusBadge, JobPriorityBadge } from '../components'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading, error } = useJob(id!)

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <EmptyState
        title="Job not found"
        description="The job you're looking for doesn't exist or has been deleted."
        action={
          <CButton color="primary" as={Link} to={ROUTES.JOBS}>
            Back to Jobs
          </CButton>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`Created ${format(new Date(job.createdAt), 'MMM d, yyyy')}`}
        actions={
          <div className="d-flex gap-2">
            <CButton color="secondary" variant="outline" onClick={() => navigate(-1)}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Back
            </CButton>
            <CButton color="primary" as={Link} to={routes.jobEdit(job.id)}>
              <CIcon icon={cilPencil} className="me-2" />
              Edit
            </CButton>
          </div>
        }
      />

      <CRow>
        <CCol lg={8}>
          {/* Status & Priority Overview */}
          <CCard className="mb-4 border-0 shadow-sm">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilInfo} className="text-primary" style={{ color: '#6366f1' }} size="lg" />
                  </div>
                  <div>
                    <small className="text-medium-emphasis d-block mb-1">Status</small>
                    <JobStatusBadge status={job.status} />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-warning bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilCheckCircle} className="text-warning" style={{ color: '#f59e0b' }} size="lg" />
                  </div>
                  <div>
                    <small className="text-medium-emphasis d-block mb-1">Priority</small>
                    <JobPriorityBadge priority={job.priority} />
                  </div>
                </div>
                {job.estimatedDuration && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-info bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                      <CIcon icon={cilClock} className="text-info" style={{ color: '#06b6d4' }} size="lg" />
                    </div>
                    <div>
                      <small className="text-medium-emphasis d-block mb-1">
                        Est. Duration
                      </small>
                      <strong className="text-body">{job.estimatedDuration} min</strong>
                    </div>
                  </div>
                )}
              </div>
            </CCardBody>
          </CCard>

          {/* Description */}
          {job.description && (
            <CCard className="mb-4 border-0 shadow-sm">
              <CCardHeader className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <CIcon icon={cilNotes} className="text-primary" style={{ color: '#6366f1' }} />
                  </div>
                  <strong className="mb-0">Description</strong>
                </div>
              </CCardHeader>
              <CCardBody className="p-4">
                <p className="mb-0 text-body" style={{ whiteSpace: 'pre-wrap' }}>
                  {job.description}
                </p>
              </CCardBody>
            </CCard>
          )}

          {/* Location */}
          {job.location?.address && (
            <CCard className="mb-4 border-0 shadow-sm">
              <CCardHeader className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-danger bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <CIcon icon={cilLocationPin} className="text-danger" style={{ color: '#f43f5e' }} />
                  </div>
                  <strong className="mb-0">Location</strong>
                </div>
              </CCardHeader>
              <CCardBody className="p-4">
                <p className="mb-0 text-body">{job.location.address}</p>
              </CCardBody>
            </CCard>
          )}

          {/* Schedule */}
          {job.scheduledAt && (
            <CCard className="mb-4 border-0 shadow-sm">
              <CCardHeader className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-success bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <CIcon icon={cilCalendar} className="text-success" style={{ color: '#10b981' }} />
                  </div>
                  <strong className="mb-0">Schedule</strong>
                </div>
              </CCardHeader>
              <CCardBody className="p-4">
                <div className="d-flex align-items-center gap-2">
                  <CIcon icon={cilClock} style={{ color: '#10b981' }} />
                  <span className="text-body">
                    {format(new Date(job.scheduledAt), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <CIcon icon={cilClock} style={{ color: '#10b981' }} />
                  <span className="text-body">
                    {format(new Date(job.scheduledAt), 'h:mm a')}
                  </span>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCol>

        <CCol lg={4}>
          {/* Timeline */}
          <CCard className="mb-4 border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-bottom py-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <CIcon icon={cilReload} className="text-primary" style={{ color: '#6366f1' }} />
                </div>
                <strong className="mb-0">Timeline</strong>
              </div>
            </CCardHeader>
            <CCardBody className="p-4">
              <div className="position-relative">
                {/* Timeline line */}
                <div
                  className="position-absolute"
                  style={{
                    left: '8px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    backgroundColor: '#e9ecef',
                  }}
                />

                {/* Timeline items */}
                <div className="position-relative ps-4 pb-3">
                  <div
                    className="position-absolute rounded-circle bg-primary"
                    style={{
                      left: '0',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px #0d6efd',
                    }}
                  />
                  <div>
                    <small className="text-medium-emphasis d-block mb-1">Created</small>
                    <div className="text-body fw-medium">
                      {format(new Date(job.createdAt), 'MMM d, yyyy')}
                    </div>
                    <small className="text-medium-emphasis">
                      {format(new Date(job.createdAt), 'h:mm a')}
                    </small>
                  </div>
                </div>

                <div className="position-relative ps-4 pb-3">
                  <div
                    className="position-absolute rounded-circle bg-info"
                    style={{
                      left: '0',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px #0dcaf0',
                    }}
                  />
                  <div>
                    <small className="text-medium-emphasis d-block mb-1">
                      Last Updated
                    </small>
                    <div className="text-body fw-medium">
                      {format(new Date(job.updatedAt), 'MMM d, yyyy')}
                    </div>
                    <small className="text-medium-emphasis">
                      {format(new Date(job.updatedAt), 'h:mm a')}
                    </small>
                  </div>
                </div>

                {job.completedAt && (
                  <div className="position-relative ps-4">
                    <div
                      className="position-absolute rounded-circle bg-success"
                      style={{
                        left: '0',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        boxShadow: '0 0 0 2px #198754',
                      }}
                    />
                    <div>
                      <small className="text-medium-emphasis d-block mb-1">
                        Completed
                      </small>
                      <div className="text-body fw-medium">
                        {format(new Date(job.completedAt), 'MMM d, yyyy')}
                      </div>
                      <small className="text-medium-emphasis">
                        {format(new Date(job.completedAt), 'h:mm a')}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </CCardBody>
          </CCard>

          {/* Quick Actions */}
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-bottom py-3">
              <strong className="mb-0">Quick Actions</strong>
            </CCardHeader>
            <CCardBody className="p-3">
              <CButton
                color="primary"
                variant="outline"
                className="w-100 mb-2"
                as={Link}
                to={routes.jobEdit(job.id)}
              >
                <CIcon icon={cilPencil} className="me-2" />
                Edit Job
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                className="w-100"
                onClick={() => navigate(-1)}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Back to List
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}
