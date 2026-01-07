import React, { useState, useEffect } from 'react';
import { MOCK_CONVOCATIONS, MOCK_MEMBERS } from '../constants';

interface ConvocacaoProps {
  startWithModalOpen?: boolean;
  onModalOpenHandled?: () => void;
}

const Convocacao: React.FC<ConvocacaoProps> = ({ startWithModalOpen, onModalOpenHandled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [isNewMember, setIsNewMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [shouldSendEmail, setShouldSendEmail] = useState(true);
  const [email, setEmail] = useState('');
  const [asoType, setAsoType] = useState('Periódico');

  // Reset form when modal opens/closes or toggles
  const handleOpenModal = () => {
    setIsNewMember(false);
    setSelectedMemberId('');
    setNewMemberName('');
    setEmail('');
    setShouldSendEmail(true);
    setAsoType('Periódico');
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (startWithModalOpen) {
      handleOpenModal();
      if (onModalOpenHandled) {
        onModalOpenHandled();
      }
    }
  }, [startWithModalOpen, onModalOpenHandled]);

  const enrichedConvocations = MOCK_CONVOCATIONS.map(c => {
    const member = MOCK_MEMBERS.find(m => m.id === c.memberId);
    return { ...c, member };
  }).filter(c => 
    c.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.asoType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return 'Pendente';
      case 'Confirmed': return 'Confirmado';
      case 'Cancelled': return 'Cancelado';
      case 'Scheduled': return 'Agendado';
      default: return status;
    }
  };

  // Handle Existing Member Selection
  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = e.target.value;
    setSelectedMemberId(memberId);
    
    if (memberId) {
      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (member) {
        setEmail(member.email);
      }
    } else {
      setEmail('');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreate = () => {
    // Mock save logic
    alert('Convocação criada com sucesso!');
    handleCloseModal();
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-1 w-full md:w-auto gap-3">
            <div className="relative flex-1 md:max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                type="text" 
                placeholder="Buscar por nome ou tipo de ASO" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400 shadow-sm outline-none" 
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-text-main hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[1.25rem] text-text-secondary">filter_list</span>
              Filtrar
            </button>
          </div>
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 px-6 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[1.25rem]">add_circle</span>
            Criar Convocação
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-soft overflow-hidden flex-1 flex flex-col min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Unidade</th>
                  <th className="px-6 py-4 font-semibold">Tipo de ASO</th>
                  <th className="px-6 py-4 font-semibold">Data da Convocação</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {enrichedConvocations.map((convocation) => (
                  <tr key={convocation.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {convocation.member?.avatarUrl ? (
                          <div 
                            className="w-9 h-9 rounded-full bg-gray-200 bg-cover bg-center border border-gray-100" 
                            style={{ backgroundImage: `url('${convocation.member.avatarUrl}')` }}
                          ></div>
                        ) : (
                           <div className={`w-9 h-9 rounded-full ${convocation.member?.bgColor} ${convocation.member?.initialsColor} flex items-center justify-center font-bold text-sm border border-gray-100`}>
                            {convocation.member?.initials}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-secondary">{convocation.member?.name}</p>
                          <p className="text-xs text-text-secondary">{convocation.member?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{convocation.member?.unit}</td>
                    <td className="px-6 py-4 text-text-main">
                      <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-text-secondary border border-gray-200">{convocation.asoType}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-secondary">{convocation.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${convocation.status === 'Pending' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' : 
                          convocation.status === 'Confirmed' ? 'bg-status-success/10 text-status-success border-status-success/20' : 
                          convocation.status === 'Scheduled' ? 'bg-status-success/10 text-status-success border-status-success/20' : 
                          'bg-status-danger/10 text-status-danger border-status-danger/20'}`}>
                        {getStatusLabel(convocation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-[1.25rem]">edit</span>
                      </button>
                      <button className="p-1.5 rounded-full text-gray-400 hover:text-status-danger hover:bg-status-danger/10 transition-colors ml-1">
                        <span className="material-symbols-outlined text-[1.25rem]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between mt-auto">
            <span className="text-xs text-text-secondary">Exibindo {enrichedConvocations.length} resultados</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-medium text-text-secondary hover:text-secondary disabled:opacity-50" disabled>Anterior</button>
              <button className="px-3 py-1 text-xs font-medium text-text-secondary hover:text-secondary">Próximo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Criar Convocação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <span className="material-symbols-outlined">campaign</span>
                 </div>
                 <h3 className="text-lg font-bold text-secondary">Nova Convocação</h3>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Member Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase">Integrante</label>
                  <label className="flex items-center cursor-pointer gap-2">
                    <span className="text-xs font-medium text-text-secondary">Integrante Novo?</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isNewMember} 
                        onChange={(e) => {
                          setIsNewMember(e.target.checked);
                          // Reset fields when toggling
                          setSelectedMemberId('');
                          setNewMemberName('');
                          setEmail('');
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                </div>

                {isNewMember ? (
                  <input 
                    type="text" 
                    placeholder="Nome completo do novo integrante"
                    value={newMemberName} 
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                ) : (
                  <div className="relative">
                    <select 
                      value={selectedMemberId} 
                      onChange={handleMemberSelect}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Selecione um integrante...</option>
                      {MOCK_MEMBERS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                )}
              </div>

              {/* Email Section */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={shouldSendEmail} 
                    onChange={(e) => setShouldSendEmail(e.target.checked)}
                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2"
                    id="sendEmail"
                  />
                  <label htmlFor="sendEmail" className="text-sm font-medium text-secondary cursor-pointer select-none">Enviar Email de Convocação</label>
                </div>
                
                {shouldSendEmail && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Email do Destinatário</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">mail</span>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@empresa.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Exame</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Admissional', 'Periódico', 'Demissional', 'Retorno ao Trabalho', 'Mudança de Risco'].map((type) => (
                     <label key={type} className={`
                        relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-sm font-medium text-center
                        ${asoType === type 
                          ? 'bg-primary/5 border-primary text-primary ring-1 ring-primary/20' 
                          : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300 hover:bg-gray-50'}
                     `}>
                        <input 
                          type="radio" 
                          name="asoType" 
                          value={type} 
                          checked={asoType === type}
                          onChange={(e) => setAsoType(e.target.value)}
                          className="sr-only"
                        />
                        {type}
                     </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreate}
                className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Criar Convocação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Convocacao;