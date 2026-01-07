export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  initials?: string;
  initialsColor?: string;
  bgColor?: string;
}

export interface Member extends User {
  lastAsoDate: string;
  expirationDate: string;
  status: 'Valid' | 'Warning' | 'Expired';
  unit: string;
}

export interface Convocation {
  id: string;
  memberId: string;
  asoType: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Scheduled';
}

export interface RecentUpdate {
  id: string;
  title: string;
  time: string;
  description: string;
  type: 'alert' | 'update' | 'create' | 'check';
  attachment?: string;
}

export interface NotificationLog {
  id: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  targetName: string;
  details?: string;
  timestamp: string;
  type: 'edit' | 'create' | 'delete' | 'system';
}

export type ViewState = 'dashboard' | 'members' | 'convocation' | 'settings' | 'notifications';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  medicalLicense: string;
  photoUrl: string;
  systemRole?: 'admin' | 'user';
}

export interface AppSettings {
  notifications: {
    expirations: boolean;
    newMembers: boolean;
    systemUpdates: boolean;
  };
  security: {
    twoFactor: boolean;
  };
}