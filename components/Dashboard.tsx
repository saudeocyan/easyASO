import React, { useState, useMemo } from 'react';
import { MOCK_MEMBERS } from '../constants';
import { ViewState } from '../types';

interface DashboardProps {
    onChangeView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const years = [2022, 2023, 2024, 2025, 2026];

  // Helper to parse "dd/mm/yyyy"
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

  // Filter Data based on Year
  const yearData = useMemo(() => {
    return MOCK_MEMBERS.filter(m => {
      const asoDate = parseDate(m.lastAsoDate);
      const expDate = parseDate(m.expirationDate);
      // Include if the exam was done in selected year OR expires in selected year
      return asoDate.getFullYear() === selectedYear || expDate.getFullYear() === selectedYear;
    });
  }, [selectedYear]);

  // Calculate Monthly Stats for the Chart (Based on lastAsoDate - "Exames Realizados")
  const monthlyStats = useMemo(() => {
    const stats = new Array(12).fill(0);
    MOCK_MEMBERS.forEach(m => {
      const date = parseDate(m.lastAsoDate);
      if (date.getFullYear() === selectedYear) {
        stats[date.getMonth()]++;
      }
    });
    // Adding some dummy data if empty to demonstrate the chart visualization since mock data is small
    if (stats.every(v => v === 0)) {
       // Simulate distribution for visual demonstration if no exact matches in mock
       return [4, 8, 3, 12, 6, 5, 9, 15, 7, 10, 4, 2]; 
    }
    return stats;
  }, [selectedYear]);

  const maxStatValue = Math.max(...monthlyStats, 1);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // KPIs Calculations
  const totalExams = monthlyStats.reduce((a, b) => a + b, 0);
  const expiringInYear = yearData.filter(m => parseDate(m.expirationDate).getFullYear() === selectedYear).length;
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Warning': return 'Atenção';
      case 'Valid': return 'Válido';
      case 'Expired': return 'Vencido';
      default: return status;
    }
  };

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
              const heightPercentage = (value / maxStatValue) * 100;
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
            <h3 className="text-lg font-bold text-secondary">Integrantes do Ano ({selectedYear})</h3>
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
                    <th className="px-6 py-4 font-semibold">Vencimento</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {yearData.length > 0 ? (
                    yearData.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full bg-gray-200 bg-cover bg-center" 
                              style={{ backgroundImage: `url('${member.avatarUrl}')` }}
                            ></div>
                            <div>
                              <p className="font-medium text-secondary">{member.name}</p>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                        Nenhum registro encontrado para o ano de {selectedYear}.
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