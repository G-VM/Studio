export type SiteType = 'Trust-Wide' | 'Central Office' | 'Secondary Academy' | 'Primary School' | 'Infant / Junior';

export interface Site {
  id: string;
  name: string;
  code: string;
  type: SiteType;
  studentCount?: number;
  staffCount?: number;
  location: string;
  networkSubnet?: string;
  badgeColor: string;
}

export type Category = 
  | 'Network & Wi-Fi'
  | 'Firewall & Security'
  | 'Student SIS & Cloud'
  | 'Classroom Audio/Visual'
  | 'Chromebooks & Fleet'
  | 'Servers & Storage'
  | 'Access Control & Cameras'
  | 'VoIP & PA Systems';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type ChangeStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Rolled Back' | 'Canceled';

export type MaintenanceWindow = 
  | 'After Hours (5 PM - 10 PM)'
  | 'Early Morning (5 AM - 7 AM)'
  | 'Weekend Window'
  | 'School Break / In-Service'
  | 'Emergency (Immediate)'
  | 'During School (Non-Disruptive)';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
}

export interface ChangeNote {
  id: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  text: string;
  type: 'update' | 'rollback' | 'verification' | 'note';
}

export interface VerificationCheck {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  siteId: string;
  locationDetail: string;
  category: Category;
  riskLevel: RiskLevel;
  status: ChangeStatus;
  maintenanceWindow: MaintenanceWindow;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  estimatedDurationMinutes: number;
  assignedTo: TeamMember;
  peerReviewerName?: string;
  requiresDowntime: boolean;
  estimatedDowntimeMinutes?: number;
  impactedUsers: string;
  rollbackPlan: string;
  verificationChecks: VerificationCheck[];
  actualStartTime?: string;
  actualEndTime?: string;
  notes: ChangeNote[];
  createdAt: string;
  updatedAt: string;
  isQuickChange?: boolean;
}

export interface ChangeTemplate {
  id: string;
  name: string;
  iconName: string;
  category: Category;
  riskLevel: RiskLevel;
  defaultTitle: string;
  defaultDescription: string;
  maintenanceWindow: MaintenanceWindow;
  estimatedDurationMinutes: number;
  requiresDowntime: boolean;
  estimatedDowntimeMinutes: number;
  impactedUsers: string;
  rollbackPlan: string;
  verificationChecks: string[];
}
