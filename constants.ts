import { Member, RecentUpdate, Convocation, UserProfile, NotificationLog, ViewState } from './types';

export const NAV_ITEMS: { id: ViewState; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'members', label: 'Integrantes', icon: 'group' },
  { id: 'convocation', label: 'Convocação', icon: 'campaign' },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
];

export const IMAGE_URLS = {
  ana: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp_y1wqr0P-NhWuntq1m0nwLhizkSF-nMwgrolYJNin0e6vVyz0jmxLku-Kn2fAJ3ux0qGfIgGZzsO8_oQgVt41pDjWzhXFiqnmfUUL3ynzhAqBYccC8Em-OrYkzY7vpLptX8fK5MBIB6Sh25SrvUX5ATvacmuTH_iPEYAicDKXRIJxMT7EIhA_WBzi7mBMkzVE_lhsgE5oE8J3L4qtJHL5vhJbDdrT7swcBUqoq8goE1RAWcqS-IU6jgcjtucSaAaAeWw13UGH6va",
  carlos: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjV2_vLcIaERJ2dZLvpNMKt68u-2mTILp-KcdJkkoddi4QhVBbxv9qpBOLs7ZobixIw4cZi54fZhFulp7sdqfyfGOcYTWMjZdhW_kkpyg86Pig9W-yPXlSZ7aqcPWlBWnZJ4_b-PqhnmK-P_OqwJTpVSx41ReCVEMnRXU09HthewrS9klqvofLyv_ILh9I0BmrR-W0qzJNpK8gyBTgvNVOTmhJLacrDSxiB0_kq0Qv6euLkA08NnFuPSs4SDyk5gMQDF-zQVHt1SZh",
  jorge: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqBxlRs1g0bRxneAQouvJl_ztUA7932G-DrEwqUsQtNoA2uasm3BVbOM14oKQ8w2VP5e3D8UCfrKwLfXb9_7lHnOHf38ZujPkypweZDLCsa2i3BY-AK3Kkrhp-NjsM6vVDUwP-KNNGKAuXTgPit_a3mco0tkxb-nGJdO9nzeFGJCmQdA4S8JPHo0Hgwul9G9hyNPsH4cKRyrerbY4ZYD2__MGjYBy9pptefpgYusByQpLoC7g4bP6ABWylH0e8FN8HcvDE7jN43tPv",
  beatriz: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwIg1ywtmsTF7qz3Gv2e2K7to3auS0RiqifFjSnZK6VjpvQF6Gfel9pf5ihs4q9jhd182DkZRMChkdlCHxuZjGdHEYDKXy-UeC2KzzgybbDtcvhWOf_sgQSVSJOXeuZCfRGq_rXJQG5PXBF7ok1TBB0S8vIuoFnA8-ScPQc1dnRLR2AV5CevTbidIhlpX7641gODoN5wMVh_reC794WRYAJmO54grIcEyrUiLvP89xj4pAGLA006OEBnHX8wpuzvSBS-DMPElh2lwQ",
  admin: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ_ApFEPxr-d8xGTTHlZ39-2xMn8M9sg0Pn-KwSAfdMTUqXbmPSERXoSaCvsNyKavK4lxfUgIEP9aStBZ2_pegZ9NrME4cwYUVxN7fL-mk9nBbN7iLNdtPzCsi8ZsIjioT7PJI9mJ76Nt2vcohX-YDQv6tPx021KnC9C3pzLcPCT4lcqoIwhBgvMl3cdxJMW9bE7saWeLOM1iuT6ilvvKdFLYyd3hwKcIZmeL7e4aFnc2iVWdlrhzOMOBG0Rf4f0IHRlPtqckZJgwj"
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.s@company.com',
    role: 'Enfermeira',
    avatarUrl: IMAGE_URLS.ana,
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
    avatarUrl: IMAGE_URLS.carlos,
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
    avatarUrl: IMAGE_URLS.jorge,
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
    avatarUrl: IMAGE_URLS.beatriz,
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
    avatarUrl: '',
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
    avatarUrl: '',
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
    avatarUrl: '',
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
    actorAvatar: IMAGE_URLS.admin,
    action: 'alterou a data do ASO de',
    targetName: 'Maria Paula',
    details: 'para 21/10/2026',
    timestamp: 'Há 10 minutos',
    type: 'edit'
  },
  {
    id: 'n2',
    actorName: 'Jorge M.',
    actorAvatar: IMAGE_URLS.jorge,
    action: 'criou uma nova convocação para',
    targetName: 'Ricardo Almeida',
    details: 'Tipo: Periódico',
    timestamp: 'Há 45 minutos',
    type: 'create'
  },
  {
    id: 'n3',
    actorName: 'Ana Silva',
    actorAvatar: IMAGE_URLS.ana,
    action: 'atualizou o cadastro de',
    targetName: 'Carlos Lima',
    details: 'Telefone de contato alterado',
    timestamp: 'Há 2 horas',
    type: 'edit'
  },
  {
    id: 'n4',
    actorName: 'Sistema',
    actorAvatar: '',
    action: 'gerou alerta de expiração para',
    targetName: 'Beatriz Souza',
    details: 'Vencimento em 30 dias',
    timestamp: 'Ontem às 14:00',
    type: 'system'
  },
  {
    id: 'n5',
    actorName: 'Dr. Roberto Silva',
    actorAvatar: IMAGE_URLS.admin,
    action: 'removeu o documento anexo de',
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
  photoUrl: IMAGE_URLS.admin
};