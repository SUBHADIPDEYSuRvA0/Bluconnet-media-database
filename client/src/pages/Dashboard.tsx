import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['companies'], queryFn: () => getCompanies({ limit: 1000 }) });

  if (isLoading) return <div className="p-8">Loading Dashboard...</div>;

  const companies = data?.data || [];
  const activeCount = companies.filter((c: any) => c.status === 'ACTIVE').length;
  const qualityA = companies.filter((c: any) => c.leadQuality === 'A').length;
  
  const qualityData = [
    { name: 'Quality A', value: qualityA, color: '#10b981' },
    { name: 'Quality B', value: companies.filter((c: any) => c.leadQuality === 'B').length, color: '#f59e0b' },
    { name: 'Quality C', value: companies.filter((c: any) => c.leadQuality === 'C').length, color: '#ef4444' },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">B2B Lead Management Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Building2 className="w-6 h-6 text-blue-600" />} title="Total Companies" value={companies.length} />
        <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} title="Active Leads" value={activeCount} />
        <StatCard icon={<Users className="w-6 h-6 text-purple-600" />} title="Quality A Leads" value={qualityA} />
        <StatCard icon={<AlertTriangle className="w-6 h-6 text-red-600" />} title="Pending Review" value={companies.filter((c: any) => c.status === 'PENDING').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Lead Quality Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={qualityData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {qualityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            {companies.slice(0, 5).map((c: any) => (
              <li key={c.id} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">{c.companyName}</span>
                <span className={`px-2 py-1 rounded text-xs ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
      <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}