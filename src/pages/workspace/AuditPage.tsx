import React, { useState } from 'react';
import { HSEAppState } from '../../services/hseDataService';
import { EmptyState } from '../../components/EmptyState';
import { History, Shield, Clock, User, FileText, Search, Filter, Download } from 'lucide-react';

interface AuditPageProps {
  appState: HSEAppState;
}

export const AuditPage: React.FC<AuditPageProps> = ({ appState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = appState.auditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.entityNumber.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(appState.auditLogs.map((l) => l.action)));

  const handleExportAudit = () => {
    const header = 'Timestamp (UTC),Actor,Role,Action,Entity Ref,Summary\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entityNumber}","${l.summary.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exousia_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#15251C]">Operational Audit History</h1>
          <p className="text-xs text-[#5D6961] mt-1">
            Chronological, immutable trail of all operational state transitions, classifications, and approvals.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#007A44]" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, entity ref, or summary..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F9F7] border border-[#DDE5DF] rounded-lg text-[#15251C] placeholder-[#5D6961] outline-hidden focus:border-[#007A44]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#5D6961]" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F7F9F7] border border-[#DDE5DF] rounded-lg text-xs font-medium text-[#15251C] outline-hidden cursor-pointer"
          >
            <option value="all">All Action Types</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
          {(searchQuery || actionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActionFilter('all');
              }}
              className="text-[#007A44] hover:underline font-semibold ml-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit entries found"
            description="No log events match your current search and action filters. Try clearing your filters to see the full audit trail."
            actionLabel="Reset filters"
            onAction={() => {
              setSearchQuery('');
              setActionFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Entity Ref</th>
                  <th className="py-3 px-4">Operational Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F9F7] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#5D6961] font-mono">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#15251C]">{log.actorName}</span>
                      <span className="text-[10px] text-[#5D6961] block font-mono">
                        ({log.actorRole.replace('_', ' ')})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F7F9F7] border border-[#DDE5DF] text-[#15251C]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-[#007A44]">
                      {log.entityNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#15251C] max-w-md">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
