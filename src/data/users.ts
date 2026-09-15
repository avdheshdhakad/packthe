import { User } from '../types';

export const USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'Dr. Ramesh Chandra',
    email: 'ramesh.chandra@gov.in',
    role: 'admin',
    department: 'Central Enforcement Directorate, New Delhi',
    badgeNumber: 'DLM-HQ-001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-officer-01',
    name: 'Smt. Priya Sharma',
    email: 'priya.sharma@lm.delhi.gov.in',
    role: 'officer',
    department: 'Directorate of Legal Metrology (North Zone)',
    badgeNumber: 'LM-OFF-2026',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-inspector-02',
    name: 'Rajesh Kumar Verma',
    email: 'rajesh.verma@lm.up.gov.in',
    role: 'inspector',
    department: 'State Standards Inspection Cell, Lucknow',
    badgeNumber: 'LM-INSP-4091',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-viewer-01',
    name: 'Anita Sen',
    email: 'anita.sen@industry-standards.org',
    role: 'viewer',
    department: 'National Consumer Protection Audit Group',
    badgeNumber: 'AUD-EXT-8812',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
];

export const SYSTEM_USERS = USERS;
