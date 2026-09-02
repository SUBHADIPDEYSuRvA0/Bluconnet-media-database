import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCompany, updateCompany } from '../lib/api';
import { X, Plus, Building2, Save } from 'lucide-react';

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  editCompany?: any;
}

const EMPTY_FORM = {
  companyName: '',
  website: '',
  linkedinUrl: '',
  email: '',
  employees: '',
  followers: '',
  companyType: '',
  baseGeo: '',
  address: '',
  services: '',
  industry: '',
  leadQuality: 'C',
  status: 'PENDING',
};

export default function CompanyForm({ open, onClose, editCompany }: CompanyFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editCompany) {
      setForm({
        companyName: editCompany.companyName || '',
        website: editCompany.website || '',
        linkedinUrl: editCompany.linkedinUrl || '',
        email: editCompany.email || '',
        employees: editCompany.employees?.toString() || '',
        followers: editCompany.followers?.toString() || '',
        companyType: editCompany.companyType || '',
        baseGeo: editCompany.baseGeo || '',
        address: editCompany.address || '',
        services: editCompany.services || '',
        industry: editCompany.industry || '',
        leadQuality: editCompany.leadQuality || 'C',
        status: editCompany.status || 'PENDING',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [editCompany, open]);

  const isEdit = !!editCompany;

  const mutation = useMutation({
    mutationFn: (payload: any) => isEdit ? updateCompany(editCompany.id, payload) : createCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      handleClose();
    },
    onError: () => setError(isEdit ? "Failed to update company." : "Failed to add company."),
  });

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.companyName.trim()) {
      setError('Company Name is required.');
      return;
    }
    const payload: any = {
      companyName: form.companyName.trim(),
      website: form.website.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
      email: form.email.trim() || null,
      employees: form.employees ? Number(form.employees) : null,
      followers: form.followers ? Number(form.followers) : null,
      companyType: form.companyType.trim() || null,
      baseGeo: form.baseGeo.trim() || null,
      address: form.address.trim() || null,
      services: form.services.trim() || null,
      industry: form.industry.trim() || null,
      leadQuality: form.leadQuality,
      status: form.status,
    };
    mutation.mutate(payload);
  };

  const handleClose = () => {
    onClose();
    setForm({ ...EMPTY_FORM });
    setError('');
    mutation.reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> {isEdit ? 'Edit Company' : 'Add Company'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name *" required>
              <input name="companyName" value={form.companyName} onChange={handleChange} className={inputCls} required />
            </Field>
            <Field label="Type">
              <select name="companyType" value={form.companyType} onChange={handleChange} className={inputCls}>
                <option value="">Select type</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
                <option value="SaaS">SaaS</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Website">
              <input name="website" value={form.website} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="LinkedIn">
              <input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Industry">
              <input name="industry" value={form.industry} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Employees">
              <input name="employees" type="number" min="0" value={form.employees} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Followers">
              <input name="followers" type="number" min="0" value={form.followers} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Base GEO">
              <input name="baseGeo" value={form.baseGeo} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Lead Quality">
              <select name="leadQuality" value={form.leadQuality} onChange={handleChange} className={inputCls}>
                <option value="A">A (High)</option>
                <option value="B">B (Medium)</option>
                <option value="C">C (Low)</option>
              </select>
            </Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Address">
            <input name="address" value={form.address} onChange={handleChange} className={inputCls} />
          </Field>
          <Field label="Services">
            <textarea name="services" value={form.services} onChange={handleChange} rows={2} className={inputCls} />
          </Field>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}