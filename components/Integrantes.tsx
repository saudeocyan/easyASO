import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { Member } from '../types';

const Integrantes: React.FC = () => {
  // State for members list
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // View Details State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Mode State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});

  // Create Mode State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState<Partial<Member>>({
    name: '',
    email: '',
    role: '',
    unit: '',
    lastAsoDate: ''
  });

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    fetchMembers();
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrantes_status_view')
        .select('*');

      if (error) throw error;

      // Map DB columns to Frontend types if needed (view matches mostly)
      const mappedMembers: Member[] = (data || []).map((m: any) => ({
        ...m,
        name: m.nome,
        role: m.cargo,
        unit: m.unidade,
        cpf: m.cpf,
        lastAsoDate: m.data_ultimo_aso ? new Date(m.data_ultimo_aso).toLocaleDateString('pt-BR') : '-',
        expirationDate: m.data_vencimento ? new Date(m.data_vencimento).toLocaleDateString('pt-BR') : '-',
        status: m.status
      }));

      setMembers(mappedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Erro ao carregar integrantes.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Warning': return 'Atenção';
      case 'Valid': return 'Válido';
      case 'Expired': return 'Vencido';
      default: return status;
    }
  };

  // --- Actions Handlers ---

  const handleActionClick = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation(); // Prevent opening details modal
    setActiveMenuId(activeMenuId === memberId ? null : memberId);
  };

  const handleDelete = async (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este integrante?')) {
      try {
        const { error } = await supabase.from('integrantes').delete().eq('id', memberId);
        if (error) throw error;

        // Log to audit (optional, could be trigger)
        // Update local state
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Erro ao excluir integrante.');
      }
    }
    setActiveMenuId(null);
  };

  const handleEditInit = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    setEditingMember(member);
    setEditForm({ ...member });
    setActiveMenuId(null);
  };

  const handleEditSave = async () => {
    if (!editingMember) return;

    try {
      // Map back to DB columns
      const updates = {
        nome: editForm.name,
        email: editForm.email,
        cargo: editForm.role,
        unidade: editForm.unit,
        // Convert DD/MM/YYYY to YYYY-MM-DD
        data_ultimo_aso: editForm.lastAsoDate?.split('/').reverse().join('-')
      };

      const { error } = await supabase
        .from('integrantes')
        .update(updates)
        .eq('id', editingMember.id);

      if (error) throw error;

      alert('Integrante atualizado com sucesso!');
      fetchMembers(); // Refresh to get calculated status

      setEditingMember(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Erro ao atualizar integrante.');
    }
  };

  const handleInputChange = (field: keyof Member, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // --- Create Handlers ---

  const handleCreateInputChange = (field: keyof Member, value: string) => {
    setNewMemberForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSave = async () => {
    // Basic validation
    if (!newMemberForm.name || !newMemberForm.email || !newMemberForm.role) {
      alert("Por favor, preencha os campos obrigatórios (Nome, Email, Cargo).");
      return;
    }

    try {
      const newMember = {
        nome: newMemberForm.name,
        email: newMemberForm.email,
        cargo: newMemberForm.role,
        unidade: newMemberForm.unit || 'Matriz',
        data_ultimo_aso: newMemberForm.lastAsoDate ? newMemberForm.lastAsoDate.split('/').reverse().join('-') : null
      };

      const { error } = await supabase
        .from('integrantes')
        .insert([newMember]);

      if (error) throw error;

      alert('Integrante cadastrado com sucesso!');
      fetchMembers(); // Refresh list structure

      setIsCreateModalOpen(false);
      setNewMemberForm({
        name: '',
        email: '',
        role: '',
        unit: '',
        lastAsoDate: ''
      });

    } catch (error) {
      console.error('Error creating member:', error);
      alert('Erro ao cadastrar integrante.');
    }
  };

  // Helper to generate mock history based on the current member
  const getMemberHistory = (member: Member) => {
    return [
      { date: member.lastAsoDate, type: 'Periódico', status: 'Concluído', current: true },
      { date: '15/10/2021', type: 'Periódico', status: 'Concluído', current: false },
      { date: '10/10/2020', type: 'Admissional', status: 'Concluído', current: false },
    ];
  };

  // --- Excel Import Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'array' });
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (!data || data.length === 0) {
            alert('Arquivo vazio ou inválido.');
            setLoading(false);
            return;
          }

          // Process data
          const processedData = data.map((row: any) => {
            // Clean CPF: remove non-numeric chars, pad with zeros
            const rawCpf = String(row['CPF'] || '');
            const cleanCpf = rawCpf.replace(/\D/g, '');
            const finalCpf = cleanCpf.padStart(11, '0');

            // Handle date (Excel serial date or string)
            let asoDate = null;
            if (row['Data Ultimo ASO']) {
              // Check if it's a number (Excel serial date)
              if (typeof row['Data Ultimo ASO'] === 'number') {
                // Excel serial date to JS Date (Excel base date is 1899-12-30)
                const date = new Date(Math.round((row['Data Ultimo ASO'] - 25569) * 86400 * 1000));
                asoDate = date.toISOString().split('T')[0];
              } else {
                // Assume string DD/MM/YYYY
                asoDate = String(row['Data Ultimo ASO']).split('/').reverse().join('-');
              }
            }

            return {
              cpf: finalCpf,
              nome: row['Nome'],
              cargo: row['Cargo'],
              unidade: row['Unidade'],
              data_ultimo_aso: asoDate
              // Note: email is not in the required columns list, but required in DB/types.
            };
          }).filter(item => item.cpf && item.nome); // Validate basic requirements

          if (processedData.length === 0) {
            alert('Nenhum dado válido encontrado (Verifique se as colunas Nome e CPF existem).');
            setLoading(false);
            return;
          }

          console.log('Dados processados para envio:', processedData);

          const { error } = await supabase
            .from('integrantes')
            .upsert(processedData, { onConflict: 'cpf' });

          if (error) throw error;

          alert('Importação concluída com sucesso!');
          fetchMembers();

        } catch (err: any) {
          console.error('Erro ao processar arquivo:', err);
          alert(`Erro ao processar o arquivo Excel: ${err.message}`);
          setLoading(false);
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error importing file:', error);
      alert('Erro ao iniciar importação.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-1 w-full lg:w-auto items-center gap-3">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[1.25rem]">search</span>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400 shadow-sm outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-secondary rounded-lg hover:bg-gray-50 hover:text-text-main transition-colors shadow-sm text-sm font-medium">
              <span className="material-symbols-outlined text-[1.25rem]">filter_list</span>
              Filtrar
            </button>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors shadow-sm"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-[1.25rem]">{loading ? 'hourglass_empty' : 'sync'}</span>
              {loading ? 'Carregando...' : 'Atualizar Ativos'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[1.25rem]">person_add</span>
              Inserir Integrante
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-soft overflow-visible flex-1 flex flex-col min-h-[500px]">
          <div className="overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-6 py-4 font-semibold w-1/4">Nome</th>
                  <th className="px-6 py-4 font-semibold">Cargo</th>
                  <th className="px-6 py-4 font-semibold">Unidade</th>
                  <th className="px-6 py-4 font-semibold">Último ASO</th>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer relative"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${member.bgColor} ${member.initialsColor} flex items-center justify-center font-bold text-sm border border-gray-100`}>
                          {member.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-secondary group-hover:text-primary transition-colors">{member.name}</p>
                          <p className="text-xs text-text-secondary">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{member.role}</td>
                    <td className="px-6 py-4 text-text-secondary">{member.unit}</td>
                    <td className="px-6 py-4 text-text-secondary">{member.lastAsoDate}</td>
                    <td className="px-6 py-4 font-medium text-secondary">{member.expirationDate}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                         ${member.status === 'Warning' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                          member.status === 'Valid' ? 'bg-status-success/10 text-status-success border-status-success/20' :
                            'bg-status-danger/10 text-status-danger border-status-danger/20'}`}>
                        {getStatusLabel(member.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => handleActionClick(e, member.id)}
                        className={`p-1.5 rounded-lg transition-colors ${activeMenuId === member.id ? 'bg-gray-100 text-secondary' : 'text-gray-400 hover:text-secondary hover:bg-gray-100'}`}
                      >
                        <span className="material-symbols-outlined text-[1.25rem]">more_vert</span>
                      </button>

                      {/* Action Dropdown */}
                      {activeMenuId === member.id && (
                        <div ref={menuRef} className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
                          <button
                            onClick={(e) => handleEditInit(e, member)}
                            className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[1.1rem] text-text-secondary">edit</span>
                            Editar Dados
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, member.id)}
                            className="w-full text-left px-4 py-3 text-sm text-status-danger hover:bg-status-danger/5 flex items-center gap-2 transition-colors border-t border-gray-50"
                          >
                            <span className="material-symbols-outlined text-[1.1rem]">delete</span>
                            Excluir Integrante
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between mt-auto">
            <p className="text-xs text-text-secondary">
              Exibindo <span className="font-semibold text-secondary">{filteredMembers.length}</span> resultados
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
              <button className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-text-secondary hover:bg-gray-50">Próximo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Details Modal (Read Only / Download) */}
      {selectedMember && !editingMember && !isCreateModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMember(null)}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="relative h-32 bg-secondary">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute -bottom-10 left-8">
                <div className={`w-24 h-24 rounded-full bg-white p-1 shadow-lg`}>
                  <div className={`w-full h-full rounded-full ${selectedMember.bgColor} ${selectedMember.initialsColor} flex items-center justify-center font-bold text-3xl`}>
                    {selectedMember.initials}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 pt-12 pb-8 overflow-y-auto">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-1">{selectedMember.name}</h2>
                <div className="flex items-center gap-3 text-sm text-text-secondary mb-6">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">work</span>
                    {selectedMember.role}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    {selectedMember.unit}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Main Action */}
                  <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all group">
                    <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform">download</span>
                    Baixar Último ASO (PDF)
                  </button>

                  {/* History Section */}
                  <div>
                    <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Histórico de ASOs</h3>
                    <div className="space-y-4">
                      {getMemberHistory(selectedMember).map((aso, idx) => (
                        <div key={idx} className="flex items-center gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 ${aso.current ? 'bg-primary border-primary' : 'bg-gray-200 border-gray-300'}`}></div>
                            {idx !== 2 && <div className="w-0.5 h-10 bg-gray-100 my-1"></div>}
                          </div>
                          <div className={`flex-1 p-3 rounded-lg border ${aso.current ? 'bg-primary/5 border-primary/20' : 'bg-white border-gray-100 hover:border-gray-200'} transition-colors`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className={`font-semibold text-sm ${aso.current ? 'text-primary' : 'text-secondary'}`}>{aso.type}</p>
                                <p className="text-xs text-text-secondary">{aso.date}</p>
                              </div>
                              {!aso.current && (
                                <button className="text-gray-400 hover:text-primary transition-colors" title="Baixar Arquivo Antigo">
                                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity" onClick={() => setEditingMember(null)}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary">Editar Dados do Integrante</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Email Corporativo</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Unidade</label>
                  <input
                    type="text"
                    value={editForm.unit || ''}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Cargo</label>
                  <input
                    type="text"
                    value={editForm.role || ''}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Data do Último ASO</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={editForm.lastAsoDate || ''}
                  onChange={(e) => handleInputChange('lastAsoDate', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <p className="text-xs text-text-secondary">O vencimento será calculado automaticamente.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary">Novo Integrante</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={newMemberForm.name || ''}
                  onChange={(e) => handleCreateInputChange('name', e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Email Corporativo</label>
                <input
                  type="email"
                  value={newMemberForm.email || ''}
                  onChange={(e) => handleCreateInputChange('email', e.target.value)}
                  placeholder="Ex: joao@empresa.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Unidade</label>
                  <input
                    type="text"
                    value={newMemberForm.unit || ''}
                    onChange={(e) => handleCreateInputChange('unit', e.target.value)}
                    placeholder="Ex: Matriz"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Cargo</label>
                  <input
                    type="text"
                    value={newMemberForm.role || ''}
                    onChange={(e) => handleCreateInputChange('role', e.target.value)}
                    placeholder="Ex: Analista"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Data do Último ASO</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={newMemberForm.lastAsoDate || ''}
                  onChange={(e) => handleCreateInputChange('lastAsoDate', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <p className="text-xs text-text-secondary">O status e vencimento (1 ano) serão automáticos.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSave}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Cadastrar Integrante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrantes;