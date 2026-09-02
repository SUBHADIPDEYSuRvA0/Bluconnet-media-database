import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanies, getImportLogs, exportCompaniesCsv, updateCompanyStatus, deleteCompany } from '../lib/api';
import { Search, Download, X, Edit2, Trash2, ToggleLeft, ToggleRight, Eye, Upload, History } from 'lucide-react';
import ImportModal from '../components/ImportModal';
import CompanyForm from '../components/CompanyForm';

export default function SuperAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [editCompany, setEditCompany] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [role, setRole] = useState<string>('');
  const [viewCompany, setViewCompany] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role || '');
      } catch {}
    }
  }, []);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['companies', page, search, status, industry, country, companyType],
    queryFn: () => getCompanies({ page, limit: 25, search, status, industry, country, companyType })
  });

  const { data: importLogs } = useQuery({ 
    queryKey: ['importLogs'], 
    queryFn: getImportLogs 
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => updateCompanyStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const resetPageAndFilter = (setter: any) => (e: any) => { setter(e.target.value); setPage(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportCompaniesCsv({ search, status, industry, country, companyType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert('Export failed.'); }
    finally { setExporting(false); }
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setIndustry(''); setCountry(''); setCompanyType(''); setPage(1); };

  const handleToggleStatus = (company: any) => {
    const newStatus = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    statusMutation.mutate({ id: company.id, status: newStatus });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Super Admin - Company Data List</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          {isSuperAdmin && (
            <button onClick={() => setImportOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={() => setCreateOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              + Add Company
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={resetPageAndFilter(setSearch)}
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select value={status} onChange={resetPageAndFilter(setStatus)} className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>
          <select value={industry} onChange={resetPageAndFilter(setIndustry)} className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">All Industries</option>
            <option value="SaaS">SaaS</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Education">Education</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Other">Other</option>
          </select>
          <select value={companyType} onChange={resetPageAndFilter(setCompanyType)} className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">All Types</option>
            <option value="Startup">Startup</option>
            <option value="SME">SME</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={clearFilters} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Company Data Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Name</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Website</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">LinkedIn Link</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mail ID</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employees</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Followers</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Base GEO</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Affiliate Manager</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={13} className="p-8 text-center text-gray-500">Loading company data...</td></tr>
            ) : (!data?.data || data.data.length === 0) ? (
              <tr><td colSpan={13} className="p-8 text-center text-gray-500">No companies found.</td></tr>
            ) : (data?.data || []).map((c: any, index: number) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-500">{(page - 1) * 25 + index + 1}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900 text-sm">{c.companyName}</div>
                </td>
                <td className="p-3">
                  {c.website ? (
                    <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[150px] block">
                      {c.website}
                    </a>
                  ) : <span className="text-gray-400 text-sm">N/A</span>}
                </td>
                <td className="p-3">
                  {c.linkedinUrl ? (
                    <a href={c.linkedinUrl.startsWith('http') ? c.linkedinUrl : `https://${c.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[150px] block">
                      LinkedIn
                    </a>
                  ) : <span className="text-gray-400 text-sm">N/A</span>}
                </td>
                <td className="p-3">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline text-sm truncate max-w-[180px] block">
                      {c.email}
                    </a>
                  ) : <span className="text-gray-400 text-sm">N/A</span>}
                </td>
                <td className="p-3 text-sm text-gray-600">{c.employees || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600">{c.followers || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600">{c.companyType || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600">{c.baseGeo || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]">{c.address || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]">{c.services || 'N/A'}</td>
                <td className="p-3 text-sm text-gray-600">{c.accountManagerName || 'N/A'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => setViewCompany(c)} className="text-green-600 hover:text-green-800 p-1" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && <button onClick={() => setEditCompany(c)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>}
                    {isSuperAdmin && <button onClick={() => handleToggleStatus(c)} className="text-orange-600 hover:text-orange-800 p-1" title={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                      {c.status === 'ACTIVE' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                    </button>}
                    {isSuperAdmin && <button onClick={() => handleDelete(c.id, c.companyName)} className="text-red-600 hover:text-red-800 p-1" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <span>Page {page} of {data?.totalPages || 1} ({data?.total || 0} total companies)</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50">Previous</button>
          <button disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
      </div>

      {/* Recent Imports Section */}
      {importLogs?.data?.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 p-4">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <History className="w-4 h-4" /> Recent Imports
          </h3>
          <div className="space-y-2 text-sm">
            {importLogs.data.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex justify-between border-b pb-2">
                <span>{log.fileName} <span className="text-gray-500">by {log.user?.name || 'Unknown'}</span></span>
                <span className="text-gray-600">
                  <span className="text-green-700">{log.imported} new</span>{' '}
                  <span className="text-red-700">{log.failed} failed</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {viewCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Company Details</h2>
              <button onClick={() => setViewCompany(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm font-medium text-gray-500">ID</span><p className="text-sm">{viewCompany.id}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Company Name</span><p className="text-sm font-semibold">{viewCompany.companyName}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Website</span><p className="text-sm">{viewCompany.website || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">LinkedIn</span><p className="text-sm">{viewCompany.linkedinUrl || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Mail ID</span><p className="text-sm">{viewCompany.email || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Employees</span><p className="text-sm">{viewCompany.employees || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Followers</span><p className="text-sm">{viewCompany.followers || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Type</span><p className="text-sm">{viewCompany.companyType || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Base GEO</span><p className="text-sm">{viewCompany.baseGeo || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Address</span><p className="text-sm">{viewCompany.address || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Services</span><p className="text-sm">{viewCompany.services || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Affiliate Manager</span><p className="text-sm">{viewCompany.accountManagerName || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Industry</span><p className="text-sm">{viewCompany.industry || 'N/A'}</p></div>
                <div><span className="text-sm font-medium text-gray-500">Status</span><p className="text-sm"><span className={`px-2 py-1 rounded text-xs ${viewCompany.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : viewCompany.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>{viewCompany.status}</span></p></div>
                <div><span className="text-sm font-medium text-gray-500">Lead Quality</span><p className="text-sm"><span className={`px-2 py-1 rounded text-xs ${viewCompany.leadQuality === 'A' ? 'bg-blue-100 text-blue-800' : viewCompany.leadQuality === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{viewCompany.leadQuality}</span></p></div>
                <div><span className="text-sm font-medium text-gray-500">Country</span><p className="text-sm">{viewCompany.country || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <CompanyForm open={createOpen} onClose={() => setCreateOpen(false)} />
      <CompanyForm open={!!editCompany} onClose={() => setEditCompany(null)} editCompany={editCompany} />
    </div>
  );
}