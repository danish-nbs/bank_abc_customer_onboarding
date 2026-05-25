import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CreateNewCasePage from './pages/CreateNewCasePage'
import IndividualCasePage from './pages/IndividualCasePage'
import BusinessCasePage from './pages/BusinessCasePage'
import UploadDocumentsPage from './pages/UploadDocumentsPage'
import ProcessingLoaderPage from './pages/ProcessingLoaderPage'
import CaseDetailsPage from './pages/CaseDetailsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cases/new" element={<CreateNewCasePage />} />
        <Route path="/cases/individual" element={<IndividualCasePage />} />
        <Route path="/cases/business" element={<BusinessCasePage />} />
        <Route path="/cases/upload-documents" element={<UploadDocumentsPage />} />
        <Route path="/processing" element={<ProcessingLoaderPage />} />
        <Route path="/cases/overview" element={<CaseDetailsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
