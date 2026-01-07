import { Member, RecentUpdate, Convocation, UserProfile, NotificationLog, ViewState } from './types';

export const NAV_ITEMS: { id: ViewState; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'members', label: 'Integrantes', icon: 'group' },
  { id: 'convocation', label: 'Convocação', icon: 'campaign' },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
];


export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.s@company.com',
    role: 'Enfermeira',
    initials: 'AS',
    initialsColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    lastAsoDate: '25/10/2022',
    expirationDate: '25/10/2023',
    status: 'Warning',
    unit: 'Rio de Janeiro'
  },
  {
    id: '2',
    name: 'Carlos Lima',
    email: 'c.lima@company.com',
    role: 'Médico',
    initials: 'CL',
    initialsColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    lastAsoDate: '02/11/2022',
    expirationDate: '02/11/2023',
    status: 'Valid',
    unit: 'Macaé'
  },
  {
    id: '3',
    name: 'Jorge M.',
    email: 'jorge.admin@company.com',
    role: 'Admin',
    initials: 'JM',
    initialsColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    lastAsoDate: '01/12/2022',
    expirationDate: '01/12/2023',
    status: 'Valid',
    unit: 'São Paulo'
  },
  {
    id: '4',
    name: 'Beatriz Souza',
    email: 'beatriz.tech@company.com',
    role: 'Técnica',
    initials: 'BS',
    initialsColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
    lastAsoDate: '15/10/2022',
    expirationDate: '15/10/2023',
    status: 'Expired',
    unit: 'Rio de Janeiro'
  },
  {
    id: '5',
    name: 'Ricardo Almeida',
    email: 'r.almeida@company.com',
    role: 'Fisioterapeuta',
    initials: 'RA',
    initialsColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    lastAsoDate: '10/01/2023',
    expirationDate: '10/01/2024',
    status: 'Valid',
    unit: 'Macaé'
  },
  {
    id: '6',
    name: 'Maria Paula',
    email: 'maria.p@company.com',
    role: 'Aux. Enfermagem',
    initials: 'MP',
    initialsColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    lastAsoDate: '05/08/2022',
    expirationDate: '05/08/2023',
    status: 'Expired',
    unit: 'Santos'
  },
  {
    id: '7',
    name: 'Maria Rodriguez',
    email: 'm.rodriguez@company.com',
    role: 'Assistente',
    initials: 'MR',
    initialsColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    lastAsoDate: '15/11/2022',
    expirationDate: '15/11/2023',
    status: 'Warning',
    unit: 'Rio de Janeiro'
  }
];

export const MOCK_CONVOCATIONS: Convocation[] = [
  {
    id: 'c1',
    memberId: '1',
    asoType: 'Periódico',
    date: '25/10/2023',
    status: 'Pending',
  },
  {
    id: 'c2',
    memberId: '2',
    asoType: 'Admissional',
    date: '02/11/2023',
    status: 'Confirmed',
  },
  {
    id: 'c3',
    memberId: '4',
    asoType: 'Retorno ao Trabalho',
    date: '15/10/2023',
    status: 'Cancelled',
  },
  {
    id: 'c4',
    memberId: '3',
    asoType: 'Demissional',
    date: '01/12/2023',
    status: 'Scheduled',
  },
  {
    id: 'c5',
    memberId: '7',
    asoType: 'Periódico',
    date: '15/11/2023',
    status: 'Pending',
  }
];

export const RECENT_UPDATES: RecentUpdate[] = [
  {
    id: 'u1',
    title: 'Alerta do Sistema',
    time: '2m atrás',
    description: 'Gerou 5 novos alertas de expiração para o próximo mês.',
    type: 'alert'
  },
  {
    id: 'u2',
    title: 'Maria atualizou o perfil',
    time: '2h atrás',
    description: 'Novo documento ASO enviado para revisão.',
    type: 'update',
    attachment: 'ASO_Maria_2023.pdf'
  },
  {
    id: 'u3',
    title: 'Nova Convocação',
    time: '5h atrás',
    description: 'Dr. Silva criou uma nova convocação para o setor de TI.',
    type: 'create'
  },
  {
    id: 'u4',
    title: 'Verificação de Conformidade',
    time: '1d atrás',
    description: 'Verificação de conformidade semanal concluída com sucesso.',
    type: 'check'
  }
];

export const MOCK_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'n1',
    actorName: 'Dr. Roberto Silva',
    action: 'alterou a data do ASO de',
    target: 'Maria Paula',
    targetName: 'Maria Paula',
    details: 'para 21/10/2026',
    timestamp: 'Há 10 minutos',
    type: 'edit'
  },
  {
    id: 'n2',
    actorName: 'Jorge M.',
    action: 'criou uma nova convocação para',
    target: 'Ricardo Almeida',
    targetName: 'Ricardo Almeida',
    details: 'Tipo: Periódico',
    timestamp: 'Há 45 minutos',
    type: 'create'
  },
  {
    id: 'n3',
    actorName: 'Ana Silva',
    action: 'atualizou o cadastro de',
    target: 'Carlos Lima',
    targetName: 'Carlos Lima',
    details: 'Telefone de contato alterado',
    timestamp: 'Há 2 horas',
    type: 'edit'
  },
  {
    id: 'n4',
    actorName: 'Sistema',
    action: 'gerou alerta de expiração para',
    target: 'Beatriz Souza',
    targetName: 'Beatriz Souza',
    details: 'Vencimento em 30 dias',
    timestamp: 'Ontem às 14:00',
    type: 'system'
  },
  {
    id: 'n5',
    actorName: 'Dr. Roberto Silva',
    action: 'removeu o documento anexo de',
    target: 'Maria Rodriguez',
    targetName: 'Maria Rodriguez',
    timestamp: 'Ontem às 09:15',
    type: 'delete'
  }
];

export const INITIAL_PROFILE: UserProfile = {
  name: 'Dr. Roberto Silva',
  email: 'roberto.silva@easyaso.com',
  role: 'Administrador',
  medicalLicense: '123456-SP',
};