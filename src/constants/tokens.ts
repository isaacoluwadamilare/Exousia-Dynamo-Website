/**
 * Brand design tokens for Exousia Dynamo Energy Ltd
 * Preserves the exact green/red/black palette from 5908895699967872765_109.jpg
 * and Exousia_HSE_Build_Specification.md
 */

export const BRAND_TOKENS = {
  // Brand sampled values
  brandGreen: '#00A651',
  brandRed: '#ED1C24',
  brandBlack: '#0E1712',

  // Accessible UI semantic tokens
  primary: '#007A44',           // Accessible darker green for interactive elements
  primaryHover: '#005D35',      // Hover/pressed state
  primarySubtle: '#EEF7F2',     // Selected rows, light cards, badge backgrounds
  primaryBorder: '#BDE3CE',

  text: '#15251C',              // High contrast primary typography
  muted: '#5D6961',             // Secondary descriptive labels
  background: '#FFFFFF',        // Pure white for documents and forms
  surface: '#F7F9F7',           // Workspace canvas & subdued layout panels
  border: '#DDE5DF',            // Clean structural borders
  
  danger: '#B42318',            // Overdue/critical error text with labels
  dangerSubtle: '#FFF0ED',      // Error and overdue highlight surfaces
  dangerBorder: '#FECDCA',

  warning: '#B54708',
  warningSubtle: '#FFFAEB',
  warningBorder: '#FEDF89',

  info: '#026AA2',
  infoSubtle: '#F0F9FF',
  infoBorder: '#B9E6FE',
} as const;

export const INITIAL_SITES = [
  { id: 'site-1', name: 'Port Harcourt Operations Base', location: 'Rivers State, Nigeria', code: 'PHC-01', active: true },
  { id: 'site-2', name: 'Warri Flowstation 4B', location: 'Delta State, Nigeria', code: 'WAR-04', active: true },
  { id: 'site-3', name: 'Offshore Platform Alpha', location: 'Niger Delta Offshore Basin', code: 'OFF-AL', active: true },
  { id: 'site-4', name: 'Maintenance Fabrication Workshop', location: 'Trans-Amadi, Port Harcourt', code: 'WS-02', active: true }
];

export const INITIAL_USERS = [
  {
    id: 'user-manager',
    name: 'Josephine Yese',
    email: 'j.yese@exousiadynamoenergy.com',
    role: 'hse_manager' as const,
    roleTitle: 'HSE General Manager',
    department: 'Health, Safety & Environment',
    siteIds: ['site-1', 'site-2', 'site-3', 'site-4'],
    active: true,
    avatar: 'JY'
  },
  {
    id: 'user-officer',
    name: 'Ibrahim Olatunji',
    email: 'i.olatunji@exousiadynamoenergy.com',
    role: 'hse_officer' as const,
    roleTitle: 'Senior HSE Officer & Lead Inspector',
    department: 'Safety Operations',
    siteIds: ['site-1', 'site-2', 'site-4'],
    active: true,
    avatar: 'IO'
  },
  {
    id: 'user-supervisor',
    name: 'Emeka Nwosu',
    email: 'e.nwosu@contractor-ops.internal',
    role: 'action_owner' as const,
    roleTitle: 'Maintenance Workshop Supervisor',
    department: 'Mechanical Maintenance',
    siteIds: ['site-4'],
    active: true,
    avatar: 'EN'
  },
  {
    id: 'user-reporter',
    name: 'Tari Amadi',
    email: 't.amadi@field-staff.internal',
    role: 'reporter' as const,
    roleTitle: 'Field Technician & Rig Operator',
    department: 'Field Production',
    siteIds: ['site-2', 'site-3'],
    active: true,
    avatar: 'TA'
  },
  {
    id: 'user-viewer',
    name: 'Dr. Arthur Cole',
    email: 'a.cole@client-rep.internal',
    role: 'management_viewer' as const,
    roleTitle: 'Operating Client Technical Director ([COMPANY 2])',
    department: 'Asset Governance',
    siteIds: ['site-1', 'site-2', 'site-3', 'site-4'],
    active: true,
    avatar: 'AC'
  },
  {
    id: 'user-admin',
    name: 'System Administrator',
    email: 'admin@hse.exousia.internal',
    role: 'admin' as const,
    roleTitle: 'Platform Systems Administrator',
    department: 'Digital Solutions',
    siteIds: ['site-1', 'site-2', 'site-3', 'site-4'],
    active: true,
    avatar: 'SA'
  }
];
