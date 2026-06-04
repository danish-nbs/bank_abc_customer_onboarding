export const currentUser = {
  name: 'Jane Cooper',
  role: 'Senior Risk Analyst',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDCenD7J3wM1gaVshn31ClBKWMkHv5UKlW7jmVrBL0RqM8K8BXIM4HwSwvLciVPJhFUWfezxIaMSvRa9VDb7J8NWs9bRsaH30c0XG5_omnRShWmjL2ZUdy7TUz_rLMYQbdzV9TMQSMpy9NyP1jV3qCJXvFG-kIR4q7TdxtBk_K5VqisAogcnfQAMPHNFJXGUYKCDG__4xVplPKm0-h1BXBaMAixdICZH4hZ0506oRBJDPJjy9eg2iFfPxhIHGdTr69JR8BEfnSNbjw',
}

export const dashboardStats = [
  {
    id: 'total_applications',
    label: 'Total Applications',
    icon: 'assignment',
    value: '15,820',
    sub: 'Lifetime submissions',
    colSpan: 'col-span-3',
    cardCls: 'bg-surface-container-lowest border border-outline-variant',
    valueCls: 'text-on-surface',
    iconCls: 'text-on-surface-variant',
    subCls: 'text-on-surface-variant',
  },
  {
    id: 'incoming_today',
    label: 'Incoming Today',
    icon: 'today',
    value: '142',
    sub: '+12%',
    subIcon: 'trending_up',
    colSpan: 'col-span-2',
    cardCls: 'bg-surface-container-lowest border border-outline-variant',
    valueCls: 'text-on-surface',
    iconCls: 'text-on-surface-variant',
    subCls: 'text-secondary',
  },
  {
    id: 'under_review',
    label: 'Under Review',
    icon: 'pending_actions',
    value: '34',
    sub: 'Pending action',
    colSpan: 'col-span-2',
    cardCls: 'bg-surface-container-lowest border border-outline-variant border-l-4 border-l-secondary-container',
    valueCls: 'text-on-surface',
    iconCls: 'text-on-surface-variant',
    subCls: 'text-on-surface-variant',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    icon: 'cancel',
    value: '412',
    sub: 'Last 30 days',
    colSpan: 'col-span-2',
    cardCls: 'bg-surface-container-lowest border border-outline-variant',
    valueCls: 'text-error',
    iconCls: 'text-error',
    subCls: 'text-on-surface-variant',
  },
  {
    id: 'approved',
    label: 'Approved',
    icon: 'check_circle',
    value: '—',
    sub: 'Lifetime approvals',
    colSpan: 'col-span-3',
    cardCls: 'bg-surface-container-lowest border border-outline-variant',
    valueCls: 'text-[#10B981]',
    iconCls: 'text-[#10B981]',
    subCls: 'text-on-surface-variant',
  },
]

// Relative bar heights (%) for the Applications per Day chart (30-day view)
export const applicationsPerDayChart = {
  period: '30D',
  dateRange: { start: 'Oct 01', mid: 'Oct 15', end: 'Oct 30' },
  bars: [60, 75, 40, 85, 55, 90, 65, 80, 45, 70],
}

export const approvalFunnel = [
  { stage: 'Submitted',  value: 15820, bgCls: 'bg-primary-container',  textCls: 'text-on-primary-container',  indent: '0%'  },
  { stage: 'Processing', value: 13922, bgCls: 'bg-secondary',           textCls: 'text-on-secondary',           indent: '5%'  },
  { stage: 'Review',     value: 6644,  bgCls: 'bg-secondary-container', textCls: 'text-on-secondary-container', indent: '10%' },
  { stage: 'Approved',   value: 5695,  bgCls: 'bg-surface-variant',     textCls: 'text-primary',                indent: '15%' },
]

export const funnelMetrics = {
  conversion: '36.2%',
  dropOff: '12.4%',
}

// stage values: 'Under Review' | 'Approved' | 'Rejected' | 'Processing' | 'Submitted'
// type values: 'individual' | 'business'
export const cases = [
  {
    id: 'APP-8921',
    applicantName: 'Acme Corp Ltd.',
    product: 'Credit Card',
    type: 'business',
    stage: 'Under Review',
    action: 'Open Case',
    submittedAt: '2024-10-30T09:14:00Z',
    assignedTo: 'Jane Cooper',
  },
  {
    id: 'APP-8920',
    applicantName: 'John Doe',
    product: 'Debit Card',
    type: 'individual',
    stage: 'Approved',
    action: 'View',
    submittedAt: '2024-10-30T08:52:00Z',
    assignedTo: 'Jane Cooper',
  },
  {
    id: 'APP-8919',
    applicantName: 'Global Trade LLC',
    product: 'Corporate Account',
    type: 'business',
    stage: 'Rejected',
    action: 'Audit',
    submittedAt: '2024-10-29T17:30:00Z',
    assignedTo: 'Jane Cooper',
  },
  {
    id: 'APP-8918',
    applicantName: 'Jane Smith',
    product: 'Investment Account',
    type: 'individual',
    stage: 'Approved',
    action: 'View',
    submittedAt: '2024-10-29T14:05:00Z',
    assignedTo: 'Jane Cooper',
  },
  {
    id: 'APP-8917',
    applicantName: 'Sunrise Ventures Ltd.',
    product: 'Corporate Account',
    type: 'business',
    stage: 'Processing',
    action: 'Open Case',
    submittedAt: '2024-10-29T11:20:00Z',
    assignedTo: 'Jane Cooper',
  },
  {
    id: 'APP-8916',
    applicantName: 'Michael Chen',
    product: 'Credit Card',
    type: 'individual',
    stage: 'Submitted',
    action: 'Open Case',
    submittedAt: '2024-10-29T10:00:00Z',
    assignedTo: null,
  },
]

// Lookup helpers
export const stageStyles = {
  'Under Review': 'bg-surface-dim text-on-surface',
  'Approved':     'bg-primary-fixed text-on-primary-fixed',
  'Rejected':     'bg-error-container text-on-error-container',
  'Processing':   'bg-secondary-container text-on-secondary-container',
  'Submitted':    'bg-surface-container text-on-surface-variant',
}
