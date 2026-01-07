import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'user';
}

interface SettingsProps {
  userProfile: UserProfile;
}

const Settings: React.FC<SettingsProps> = ({ userProfile }) => {
  const [profile] = useState(userProfile);
  const [viewMode, setViewMode] = useState<'profile' | 'password' | 'access'>('profile');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  // Invite Flow State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Fetch users when entering access mode
  React.useEffect(() => {
    if (viewMode === 'access' && userProfile.systemRole === 'admin') {
      fetchUsers();
    }
  }, [viewMode, userProfile.systemRole]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('usuarios').select('*');
    if (data) setUsersList(data as User[]);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return alert('Email é obrigatório');
    setLoadingInvite(true);

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, name: inviteName }
      });

      if (error) throw error;

      alert('Convite enviado com sucesso!');
      setInviteEmail('');
      setInviteName('');
      fetchUsers(); // Refresh list
    } catch (error: any) {
      alert('Erro ao enviar convite: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleSavePassword = () => {
    if (!passwords.new || !passwords.confirm) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('As senhas não coincidem.');
      return;
    }

    // Mock API call
    alert('Senha alterada com sucesso!');
    setPasswords({ new: '', confirm: '' });
    setViewMode('profile');
  };

  const handleCancelPassword = () => {
    setPasswords({ new: '', confirm: '' });
    setViewMode('profile');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <section className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden relative transition-all duration-300">

          {/* Header Changes based on Mode */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${viewMode === 'password' ? 'bg-primary/10 text-primary' :
              viewMode === 'access' ? 'bg-purple-100 text-purple-600' :
                'bg-secondary/5 text-secondary'
              }`}>
              <span className="material-symbols-outlined">
                {viewMode === 'password' ? 'lock_reset' : viewMode === 'access' ? 'admin_panel_settings' : 'person'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-secondary">
              {viewMode === 'password' ? 'Alterar Senha' : viewMode === 'access' ? 'Gestão de Acessos' : 'Perfil do Usuário'}
            </h3>
          </div>

          <div className="p-8">
            {viewMode === 'profile' && (
              // --- VIEW MODE: PROFILE ---
              <>
                <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div
                    className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-gray-50 shadow-inner mb-4"
                    style={{ backgroundImage: `url('${profile.photoUrl}')` }}
                  ></div>
                  <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    Alterar Foto
                  </button>
                </div>

                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 delay-75">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.name}
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed p-2.5 focus:ring-0 focus:border-gray-200"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">lock</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed p-2.5 focus:ring-0 focus:border-gray-200"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">lock</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {viewMode === 'password' && (
              // --- VIEW MODE: CHANGE PASSWORD ---
              <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                  <p className="text-sm text-blue-800">
                    Para sua segurança, a nova senha deve conter no mínimo 8 caracteres, incluindo letras e números.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nova Senha</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-200 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Repetir Nova Senha</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full bg-white border rounded-lg text-sm p-2.5 focus:ring-2 outline-none transition-all
                        ${passwords.confirm && passwords.new !== passwords.confirm
                          ? 'border-status-danger focus:ring-status-danger/20'
                          : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {passwords.confirm && passwords.new !== passwords.confirm && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-status-danger text-xs font-medium">Não coincidem</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'access' && userProfile.systemRole === 'admin' && (
              // --- VIEW MODE: ACCESS MANAGEMENT ---
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

                {/* Invite Form */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">send</span> Convidar Novo Usuário
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1 block">Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colaborador@empresa.com"
                        className="w-full bg-white border border-purple-200 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1 block">Nome (Opcional)</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                        placeholder="Nome do Colaborador"
                        className="w-full bg-white border border-purple-200 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleInvite}
                      disabled={loadingInvite}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingInvite ? 'Enviando...' : 'Enviar Convite'}
                      {!loadingInvite && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                    </button>
                  </div>
                </div>

                {/* Users List */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">group</span> Usuários Ativos
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                        <tr>
                          <th className="px-6 py-3">Nome</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Função</th>
                          <th className="px-6 py-3 text-right">Cadastrado em</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900">{user.nome || '-'}</td>
                            <td className="px-6 py-3">{user.email}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right text-xs">
                              —
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                              Nenhum usuário encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
            {viewMode === 'profile' ? (
              <>
                <button
                  onClick={() => setViewMode('password')}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-primary hover:border-primary transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  Alterar Senha
                </button>
                {userProfile.systemRole === 'admin' && (
                  <button
                    onClick={() => setViewMode('access')}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    Gestão de Acessos
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (viewMode === 'access') setViewMode('profile');
                    else handleCancelPassword();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
                >
                  {viewMode === 'access' ? 'Voltar' : 'Cancelar'}
                </button>
                {viewMode === 'password' && (
                  <button
                    onClick={handleSavePassword}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Confirmar Alteração
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;