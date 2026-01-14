import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/logger';

interface AsoLaunchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SimpleMember {
    id: string;
    name: string;
    role: string;
    unit: string;
}

const AsoLaunchModal: React.FC<AsoLaunchModalProps> = ({ isOpen, onClose }) => {
    const [members, setMembers] = useState<SimpleMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedMember, setSelectedMember] = useState<SimpleMember | null>(null);
    const [asoForm, setAsoForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Periódico',
        obs: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            // Reset state on open
            setSelectedMember(null);
            setAsoForm({
                date: new Date().toISOString().split('T')[0],
                type: 'Periódico',
                obs: ''
            });
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            // Fetch only needed fields
            const { data, error } = await supabase
                .from('integrantes')
                .select('id, nome, cargo, unidade')
                .order('nome');

            if (error) throw error;

            const mapped = (data || []).map((m: any) => ({
                id: m.id,
                name: m.nome,
                role: m.cargo,
                unit: m.unidade
            }));

            setMembers(mapped);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLaunch = async () => {
        if (!selectedMember || !asoForm.date || !asoForm.type) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const { error } = await supabase
                .from('integrantes')
                .update({ data_ultimo_aso: asoForm.date })
                .eq('id', selectedMember.id);

            if (error) throw error;

            await logAction(
                'aso_launch',
                `Integrante: ${selectedMember.name}`,
                `Lançamento de ASO ${asoForm.type} em ${asoForm.date}. Obs: ${asoForm.obs}`
            );

            alert('ASO lançado com sucesso!');
            onClose();

        } catch (error) {
            console.error('Error launching ASO:', error);
            alert('Erro ao lançar ASO.');
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                    <h3 className="text-lg font-bold text-secondary">Lançar ASO</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-secondary">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Member Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">
                            {selectedMember ? 'Integrante Selecionado' : 'Selecione o Integrante'}
                        </label>

                        {!selectedMember ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar integrante..."
                                        className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {searchTerm && (
                                    <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg bg-white shadow-sm">
                                        {filteredMembers.length > 0 ? (
                                            filteredMembers.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMember(m)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex flex-col border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="font-semibold text-secondary">{m.name}</span>
                                                    <span className="text-xs text-text-secondary">{m.role}  • {m.unit}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-gray-400 text-center">Nenhum integrante encontrado.</div>
                                        )}
                                    </div>
                                )}
                                {/* Initial quick list if search is empty? Maybe not to save space, user must search */}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <div>
                                    <p className="font-bold text-secondary">{selectedMember.name}</p>
                                    <p className="text-xs text-text-secondary">{selectedMember.role}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="text-sm text-primary font-semibold hover:underline"
                                >
                                    Trocar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Form - Only show if member is selected */}
                    {selectedMember && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Data do Exame</label>
                                    <input
                                        type="date"
                                        value={asoForm.date}
                                        onChange={(e) => setAsoForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase">Tipo de ASO</label>
                                    <select
                                        value={asoForm.type}
                                        onChange={(e) => setAsoForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary"
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none text-secondary"
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-white hover:text-secondary transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleLaunch}
                        disabled={!selectedMember}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[1.2rem]">check</span>
                        Lançar ASO
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AsoLaunchModal;
