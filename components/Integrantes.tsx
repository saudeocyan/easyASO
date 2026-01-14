import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { Member } from '../types';
import { logAction } from '../utils/logger';

const Integrantes: React.FC = () => {
  // State for members list
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  // Pagination & Filters State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  // View Details State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [asoHistory, setAsoHistory] = useState<any[]>([]);

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Mode State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});

  // Create Mode State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState<Partial<Member>>({
    name: '',
    cpf: '',
    email: '',
    role: '',
    unit: '',
    lastAsoDate: ''
  });

  // Launch ASO State
  const [isLaunchAsoModalOpen, setIsLaunchAsoModalOpen] = useState(false);
  const [asoTargetMember, setAsoTargetMember] = useState<Member | null>(null);
  const [asoForm, setAsoForm] = useState({
    date: '',
    type: 'Periódico',
    obs: ''
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



      const calculateStatus = (dateStr: string | null): Member['status'] => {
        if (!dateStr) return 'Expired'; // Or Urgent? Assuming expired if no date or old logic.

        // dateStr comes as YYYY-MM-DD from view usually, or we can use the JS Date
        const today = new Date();
        const expiration = new Date(dateStr);

        // Calculate difference in days
        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Expired';
        if (diffDays < 30) return 'Urgent';
        if (diffDays < 60) return 'Summon';
        if (diffDays < 90) return 'Near';
        return 'Valid';
      };

      // Map DB columns to Frontend types if needed (view matches mostly)
      const mappedMembers: Member[] = (data || []).map((m: any) => ({
        ...m,
        name: m.nome,
        role: m.cargo,
        unit: m.unidade,
        cpf: m.cpf,
        lastAsoDate: m.data_ultimo_aso ? new Date(m.data_ultimo_aso).toLocaleDateString('pt-BR') : '-',
        expirationDate: m.data_vencimento ? new Date(m.data_vencimento).toLocaleDateString('pt-BR') : '-',
        status: calculateStatus(m.data_vencimento)
      }));

      setMembers(mappedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Erro ao carregar integrantes.');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterUnit]);

  const filteredMembers = members.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (m.name || '').toLowerCase().includes(searchLower);
    const emailMatch = (m.email || '').toLowerCase().includes(searchLower);
    const statusMatch = filterStatus ? m.status === filterStatus : true;
    const unitMatch = filterUnit ? m.unit === filterUnit : true;

    return (nameMatch || emailMatch) && statusMatch && unitMatch;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique units for filter
  const uniqueUnits = Array.from(new Set(members.map(m => m.unit))).filter(Boolean).sort();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Warning': return 'Atenção';
      case 'Valid': return 'Válido';
      case 'Expired': return 'Vencido';
      case 'Urgent': return 'Urgente';
      case 'Summon': return 'Convocar';
      case 'Near': return 'Próximo do Vencimento';
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

        // Log to audit
        await logAction('delete', `Integrante: ${members.find(m => m.id === memberId)?.name}`, `ID: ${memberId}`);

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
        data_ultimo_aso: (() => {
          if (!editForm.lastAsoDate) return null;
          // Clean the string
          const raw = editForm.lastAsoDate.trim();

          // Case 1: DD/MM/YYYY (most likely from input mask/placeholder)
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
            const parts = raw.split('/');
            // Ensure YYYY-MM-DD
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          // Case 2: YYYY-MM-DD (already ISO)
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return raw;
          }

          // Fallback: try Date parse but be careful with timezones or US format if not ISO
          // If we can't parse it confidently, might return original or null.
          // For now, let's stick to the manual swap if it looks like date.

          // Attempt default split if matches patterns like d-m-y
          const parts = raw.split(/[-/]/);
          if (parts.length === 3) {
            // Assume day first if year is last (common in BR)
            if (parts[2].length === 4) {
              return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            // Assume year first
            if (parts[0].length === 4) {
              return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
          return null;
        })()
      };

      const { error } = await supabase
        .from('integrantes')
        .update(updates)
        .eq('id', editingMember.id);

      if (error) throw error;

      alert('Integrante atualizado com sucesso!');
      await logAction('edit', `Integrante: ${editForm.name}`, `Atualizou dados do integrante`);

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
    if (!newMemberForm.name || !newMemberForm.email || !newMemberForm.role || !newMemberForm.cpf) {
      alert("Por favor, preencha os campos obrigatórios (Nome, CPF, Email, Cargo).");
      return;
    }

    try {
      const newMember = {
        nome: newMemberForm.name,
        cpf: newMemberForm.cpf.replace(/\D/g, ''), // Clean CPF
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
      await logAction('create', `Integrante: ${newMemberForm.name}`, `Novo integrante cadastrado`);

      fetchMembers(); // Refresh list structure

      setIsCreateModalOpen(false);
      setNewMemberForm({
        name: '',
        cpf: '',
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

  // --- Launch ASO Handlers ---

  const handleLaunchAsoInit = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    setAsoTargetMember(member);
    setAsoForm({
      date: new Date().toISOString().split('T')[0], // Default today
      type: 'Periódico',
      obs: ''
    });
    setIsLaunchAsoModalOpen(true);
    setActiveMenuId(null);
  };

  const handleLaunchAsoSave = async () => {
    if (!asoTargetMember || !asoForm.date || !asoForm.type) {
      alert("Por favor, preencha a data e o tipo.");
      return;
    }

    try {
      // 1. Update Member's last ASO date
      const { error: updateError } = await supabase
        .from('integrantes')
        .update({ data_ultimo_aso: asoForm.date })
        .eq('id', asoTargetMember.id);

      if (updateError) throw updateError;

      // 2. Log Action
      await logAction(
        'aso_launch',
        `Integrante: ${asoTargetMember.name}`,
        `Lançamento de ASO ${asoForm.type} em ${asoForm.date}. Obs: ${asoForm.obs}`
      );

      alert('ASO lançado com sucesso!');

      // 3. Refresh & Close
      fetchMembers();
      setIsLaunchAsoModalOpen(false);
      setAsoTargetMember(null);
      setAsoForm({ date: '', type: 'Periódico', obs: '' });

    } catch (error) {
      console.error('Error launching ASO:', error);
      alert('Erro ao lançar ASO.');
    }
  };

  // Fetch member history from audit logs
  useEffect(() => {
    if (selectedMember) {
      fetchMemberHistory(selectedMember);
    }
  }, [selectedMember]);

  const fetchMemberHistory = async (member: Member) => {
    try {
      // 1. Fetch logs
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'aso_launch')
        .eq('target', `Integrante: ${member.name}`)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // 2. Parse logs
      const historyFromLogs = (logs || []).map(log => {
        // Regex to extract Type and Date: "Lançamento de ASO {Type} em {YYYY-MM-DD}..."
        // Supports old format with "por Dr..." and new format without it.
        const match = log.details.match(/Lançamento de ASO (.+) em (\d{4}-\d{2}-\d{2})/);
        if (match) {
          const [_, type, dateISO] = match;
          const [year, month, day] = dateISO.split('-');
          const dateFormatted = `${day}/${month}/${year}`;
          return {
            date: dateFormatted,
            type: type,
            status: 'Concluído',
            logId: log.id,
            timestamp: new Date(log.timestamp).getTime()
          };
        }
        return null; // Should not happen if format is consistent
      }).filter(Boolean) as any[];

      // 3. Merge with current 'lastAsoDate' from Member record (which might come from Excel import)
      // We want to ensure the "Current" date displayed in the table is also in the history.
      const combinedHistory = [...historyFromLogs];

      if (member.lastAsoDate && member.lastAsoDate !== '-') {
        // Check if this date (DD/MM/YYYY) is already in the logs
        const existsInLogs = historyFromLogs.some(h => h.date === member.lastAsoDate);

        if (!existsInLogs) {
          // If not in logs (e.g. from Excel), add it. 
          // We assume it's the latest if the logic holds, or we just sort by date.
          // Since we don't know the exact timestamp, we create one from the date string.
          const [d, m, y] = member.lastAsoDate.split('/');
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d));

          combinedHistory.push({
            date: member.lastAsoDate,
            type: 'Importado', // Indicate source
            status: 'Concluído',
            isImported: true,
            timestamp: dateObj.getTime()
          });
        }
      }

      // 4. Sort by timestamp descending
      combinedHistory.sort((a, b) => b.timestamp - a.timestamp);

      // 5. Mark top as current
      const finalHistory = combinedHistory.map((h, idx) => ({
        ...h,
        current: idx === 0
      }));

      setAsoHistory(finalHistory);

    } catch (err) {
      console.error('Error fetching history:', err);
    }
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

          // Pre-process and validate for duplicates
          const cpfMap = new Map<string, number[]>(); // Map CPF -> Array of Row Indices (1-based from Excel view)
          const processedData: any[] = [];
          const duplicates: string[] = [];

          // First pass: Process, clean, and check duplicates
          data.forEach((row: any, index: number) => {
            // Clean CPF
            const rawCpf = String(row['CPF'] || '');
            const cleanCpf = rawCpf.replace(/\D/g, '');

            if (!cleanCpf) return; // Skip rows without CPF

            const finalCpf = cleanCpf.padStart(11, '0');
            const excelRowNumber = index + 2; // +2 because index is 0-based and header is row 1

            // Check duplicate in map
            if (cpfMap.has(finalCpf)) {
              cpfMap.get(finalCpf)?.push(excelRowNumber);
            } else {
              cpfMap.set(finalCpf, [excelRowNumber]);
            }

            // Handle date
            let asoDate = null;
            if (row['Data Ultimo ASO']) {
              if (typeof row['Data Ultimo ASO'] === 'number') {
                const date = new Date(Math.round((row['Data Ultimo ASO'] - 25569) * 86400 * 1000));
                asoDate = date.toISOString().split('T')[0];
              } else {
                asoDate = String(row['Data Ultimo ASO']).split('/').reverse().join('-');
              }
            }

            processedData.push({
              cpf: finalCpf,
              nome: row['Nome'],
              email: row['Email'],
              cargo: row['Cargo'],
              unidade: row['Unidade'],
              data_ultimo_aso: asoDate
            });
          });

          // Identify actual duplicates
          const errorMessages: string[] = [];
          cpfMap.forEach((rows, cpf) => {
            if (rows.length > 1) {
              errorMessages.push(`CPF ${cpf} aparece ${rows.length} vezes (Linhas: ${rows.join(', ')})`);
            }
          });

          if (errorMessages.length > 0) {
            alert(`Erro: Duplicidade encontrada no arquivo.\n\n${errorMessages.join('\n')}\n\nCorrija o Excel e tente novamente.`);
            setLoading(false);
            return;
          }

          if (processedData.length === 0) {
            alert('Nenhum dado válido encontrado (Verifique se as colunas Nome, CPF e Email existem).');
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
      <div className="max-w-7xl mx-auto flex flex-col min-h-full">
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
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white border ${isFilterOpen || filterStatus || filterUnit ? 'border-primary text-primary' : 'border-gray-200 text-text-secondary'} rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium`}
              >
                <span className="material-symbols-outlined text-[1.25rem]">filter_list</span>
                Filtrar {(filterStatus || filterUnit) && '(Ativo)'}
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 animate-in fade-in zoom-in duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Todos</option>
                        <option value="Valid">Válido</option>
                        <option value="Near">Próximo do Vencimento</option>
                        <option value="Summon">Convocar</option>
                        <option value="Urgent">Urgente</option>
                        <option value="Expired">Vencido</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Unidade</label>
                      <select
                        value={filterUnit}
                        onChange={(e) => setFilterUnit(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Todas</option>
                        {uniqueUnits.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    {(filterStatus || filterUnit) && (
                      <button
                        onClick={() => { setFilterStatus(''); setFilterUnit(''); }}
                        className="w-full text-xs text-status-danger font-medium hover:underline text-center"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Members Counter */}
            <div className="hidden sm:block pl-2 border-l border-gray-200 h-8 self-center flex items-center">
              <p className="text-sm font-medium text-secondary">
                <span className="font-bold text-primary">{filteredMembers.length}</span> Integrantes Ativos
              </p>
            </div>
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-soft flex flex-col relative">
          <div className="overflow-x-auto rounded-t-xl">
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
                {paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer relative"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar removed as requested 
                        <div className={`w-9 h-9 rounded-full ${member.bgColor} ${member.initialsColor} flex items-center justify-center font-bold text-sm border border-gray-100`}>
                          {member.initials}
                        </div> 
                        */}
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
                         ${member.status === 'Urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          member.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' :
                            member.status === 'Summon' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              member.status === 'Near' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-green-100 text-green-800 border-green-200'}`}>
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
                            onClick={(e) => handleLaunchAsoInit(e, member)}
                            className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-50 bg-primary/5 hover:bg-primary/10"
                          >
                            <span className="material-symbols-outlined text-[1.1rem] text-primary">medical_services</span>
                            <span className="text-primary font-medium">Lançar ASO</span>
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
              Página <span className="font-semibold text-secondary">{currentPage}</span> de <span className="font-semibold text-secondary">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
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
              {/* Avatar removed as requested */}
              <div className="absolute -bottom-10 left-8">
                {/* Placeholder or just name title style if needed, but for now removing circle content 
                    User requested to remove circle. I will keep the spacing or just remove the element.
                    "retire o circulo para 'avatar' que fica em cima do nome"
                */}
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
                      {asoHistory.length === 0 ? (
                        <p className="text-sm text-text-secondary">Nenhum histórico encontrado.</p>
                      ) : (
                        asoHistory.map((aso, idx) => (
                          <div key={idx} className="flex items-center gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 ${aso.current ? 'bg-primary border-primary' : 'bg-gray-200 border-gray-300'}`}></div>
                              {idx !== asoHistory.length - 1 && <div className="w-0.5 h-10 bg-gray-100 my-1"></div>}
                            </div>
                            <div className={`flex-1 p-3 rounded-lg border ${aso.current ? 'bg-primary/5 border-primary/20' : 'bg-white border-gray-100 hover:border-gray-200'} transition-colors`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className={`font-semibold text-sm ${aso.current ? 'text-primary' : 'text-secondary'}`}>{aso.type}</p>
                                  <p className="text-xs text-text-secondary">{aso.date}</p>
                                </div>
                                {/* Removed download button for now as per previous mock (no implementation yet) */}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch ASO Modal */}
      {isLaunchAsoModalOpen && asoTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity" onClick={() => setIsLaunchAsoModalOpen(false)}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-lg font-bold text-secondary">Lançar ASO</h3>
                <p className="text-xs text-text-secondary">Integrante: <span className="font-semibold">{asoTargetMember.name}</span></p>
              </div>
              <button onClick={() => setIsLaunchAsoModalOpen(false)} className="text-gray-400 hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Data do Exame</label>
                  <input
                    type="date"
                    value={asoForm.date}
                    onChange={(e) => setAsoForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Tipo de ASO</label>
                  <select
                    value={asoForm.type}
                    onChange={(e) => setAsoForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="Periódico">Periódico</option>
                    <option value="Admissional">Admissional</option>
                    <option value="Demissional">Demissional</option>
                    <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                    <option value="Mudança de Função">Mudança de Função</option>
                  </select>
                </div>
              </div>



              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Observações</label>
                <textarea
                  value={asoForm.obs}
                  onChange={(e) => setAsoForm(prev => ({ ...prev, obs: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsLaunchAsoModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLaunchAsoSave}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[1.2rem]">check</span>
                Lançar ASO
              </button>
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
                <label className="text-xs font-bold text-text-secondary uppercase">CPF</label>
                <input
                  type="text"
                  value={newMemberForm.cpf || ''}
                  onChange={(e) => handleCreateInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
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