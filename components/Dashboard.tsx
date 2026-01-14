import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ViewState, Member } from '../types';

interface DashboardProps {
  onChangeView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('integrantes_status_view') // Fetching from view to get status calculation if needed, though simpler fetch from table was requested, view has all data + status
          .select('*');

        if (error) throw error;

        // Map DB data to Member interface
        const mappedMembers: Member[] = (data || []).map((m: any) => ({
          id: m.id,
          name: m.nome,
          email: m.email,
          role: m.cargo,
          unit: m.unidade, // mapped to unit below
          lastAsoDate: m.data_ultimo_aso ? new Date(m.data_ultimo_aso).toLocaleDateString() : 'N/A',
          expirationDate: m.data_vencimento ? new Date(m.data_vencimento).toLocaleDateString() : 'N/A',
          status:
            m.status === 'Vencido' ? 'Expired' :
              m.status === 'Convocar Urgente' ? 'Urgent' :
                m.status === 'Próximo do Vencimento' ? 'Warning' : 'Valid',
          // Initials generation
          initials: m.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          initialsColor: 'text-white',
          bgColor: 'bg-primary'
        }));

        setMembers(mappedMembers);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Helper to parse "dd/mm/yyyy" to Date object
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  };

  // Determine Available Years dynamically
  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    members.forEach(m => {
      const date = parseDate(m.lastAsoDate);
      if (date) {
        uniqueYears.add(date.getFullYear());
      }
    });
    // Ensure current year is always an option
    uniqueYears.add(new Date().getFullYear());
    return Array.from(uniqueYears).sort((a, b) => b - a); // Descending
  }, [members]);

  // Filter Data based on Year (Exames Realizados in selected Year)
  const yearData = useMemo(() => {
    return members.filter(m => {
      const asoDate = parseDate(m.lastAsoDate);
      // Filter logic: Show exams performed in the selected year
      return asoDate && asoDate.getFullYear() === selectedYear;
    }).sort((a, b) => {
      // Sort descending by lastAsoDate
      const dateA = parseDate(a.lastAsoDate);
      const dateB = parseDate(b.lastAsoDate);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [selectedYear, members]);

  // Calculate Monthly Stats for the Chart (Based on lastAsoDate)
  const monthlyStats = useMemo(() => {
    const stats = new Array(12).fill(0);
    members.forEach(m => {
      const date = parseDate(m.lastAsoDate);
      if (date && date.getFullYear() === selectedYear) {
        stats[date.getMonth()]++;
      }
    });
    return stats;
  }, [selectedYear, members]);

  const maxStatValue = Math.max(...monthlyStats, 1);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // KPIs Calculations
  const totalExams = monthlyStats.reduce((a, b) => a + b, 0);

  // Vencimentos logic: Count members whose expiration date is in the selected year
  const expiringInYear = members.filter(m => {
    const expDate = parseDate(m.expirationDate);
    return expDate && expDate.getFullYear() === selectedYear;
  }).length;


  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Controls */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-secondary">Resumo Anual</h3>
            <p className="text-xs text-text-secondary">Visão geral dos exames e pendências</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">Ano de Referência:</span>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-200 text-secondary py-2 pl-4 pr-10 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer shadow-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[1.25rem]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">Exames Realizados ({selectedYear})</h3>
            <p className="text-3xl font-bold text-secondary">{totalExams}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-status-warning/10 rounded-lg text-status-warning">
                <span className="material-symbols-outlined">event_busy</span>
              </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">Vencimentos em {selectedYear}</h3>
            <p className="text-3xl font-bold text-status-warning">{expiringInYear}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">Média Mensal</h3>
            <p className="text-3xl font-bold text-secondary">{(totalExams / 12).toFixed(1)}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
          <h3 className="text-lg font-bold text-secondary mb-6">Distribuição de Exames Realizados ({selectedYear})</h3>
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {monthlyStats.map((value, index) => {
              const heightPercentage = maxStatValue > 0 ? (value / maxStatValue) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
                  <div className="relative w-full flex justify-end flex-col items-center h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-xs py-1 px-2 rounded mb-2 whitespace-nowrap z-10 pointer-events-none">
                      {value} Exames
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary"></div>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercentage}%` }}
                      className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out relative
                        ${value === 0 ? 'bg-gray-100 min-h-[4px]' : 'bg-primary hover:bg-primary-dark'}
                      `}
                    >
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-secondary mt-3">{months[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Section (Expanded to full width) */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-secondary">Últimos Exames</h3>
            <button
              onClick={() => onChangeView('members')}
              className="text-primary text-sm font-medium hover:text-primary-dark transition-colors"
            >
              Gerenciar Integrantes
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                    <th className="px-6 py-4 font-semibold">Nome</th>
                    <th className="px-6 py-4 font-semibold">Cargo</th>
                    <th className="px-6 py-4 font-semibold">Unidade</th>
                    <th className="px-6 py-4 font-semibold">Último ASO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">Carregando dados...</td>
                    </tr>
                  ) : yearData.length > 0 ? (
                    yearData.slice(0, 10).map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full ${member.bgColor || 'bg-gray-200'} ${member.initialsColor || 'text-gray-600'} flex items-center justify-center font-bold text-xs`}
                            >
                              {member.initials || member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-secondary">{member.name}</p>
                              <p className="text-xs text-text-secondary">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{member.role}</td>
                        <td className="px-6 py-4 text-text-secondary">{member.unit}</td>
                        <td className="px-6 py-4 text-text-secondary">{member.lastAsoDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                        Nenhum exame encontrado para o ano de {selectedYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;