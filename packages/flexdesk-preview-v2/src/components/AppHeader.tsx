import { useDispatch, useSelector } from 'react-redux'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'

import { type RootState, set } from '../store'
import AppBreadcrumb from './AppBreadcrumb'

export function AppHeader() {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state: RootState) => state.sidebarShow)

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch(set({ sidebarShow: !sidebarShow }))}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="ms-auto">
          <AppBreadcrumb />
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}
