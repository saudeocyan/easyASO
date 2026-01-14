export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials?: string;
  initialsColor?: string;
  bgColor?: string;
}

export interface Member extends User {
  cargo?: string; // mapped from DB 'cargo'
  unidade?: string; // mapped from DB 'unidade'
  cpf?: string; // mapped from DB 'cpf'
  lastAsoDate: string; // mapped from DB 'data_ultimo_aso'
  expirationDate: string; // mapped from DB view 'data_vencimento'

  status: 'Valid' | 'Warning' | 'Expired' | 'Urgent' | 'Summon' | 'Near'; // mapped from DB view 'status'
  unit: string; // kept for compatibility, will map 'unidade' to this
}

export interface Convocation {
  id: string;
  memberId: string; // mapped from 'integrante_id'
  asoType: string; // mapped from 'tipo_aso'
  date: string; // mapped from 'data_convocacao'
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Scheduled'; // mapped from 'status'
  obs?: string; // mapped from 'obs'
  member?: Member; // Joined member data
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
  actor_id?: string;
  actorName: string;
  action: string;
  target: string; // mapped from 'target'
  targetName?: string; // alias for target
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