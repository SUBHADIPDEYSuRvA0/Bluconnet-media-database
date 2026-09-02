import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCompany, updateCompany } from '../lib/api';
import { Plus, Save, Building2 } from 'lucide-react';
import { Modal, Field, Input, Select, Button } from './ui';
import { useToast } from './Toast';

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
  phone: '',
  salesNumber: '',
  whatsappNumber: '',
  telegramTeams: '',
  contactPersonName: '',
  contactPersonPhone: '',
  advertiserId: '',
  advertiserName: '',
  accountManagerName: '',
};

export default function CompanyForm({ open, onClose, editCompany }: CompanyFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

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
        phone: editCompany.phone || '',
        salesNumber: editCompany.salesNumber || '',
        whatsappNumber: editCompany.whatsappNumber || '',
        telegramTeams: editCompany.telegramTeams || '',
        contactPersonName: editCompany.contactPersonName || '',
        contactPersonPhone: editCompany.contactPersonPhone || '',
        advertiserId: editCompany.advertiserId || '',
        advertiserName: editCompany.advertiserName || '',
        accountManagerName: editCompany.accountManagerName || '',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [editCompany, open]);

  const isEdit = !!editCompany;

  const mutation = useMutation({
    mutationFn: (payload: any) => (isEdit ? updateCompany(editCompany.id, payload) : createCompany(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(isEdit ? 'Company updated' : 'Company added', isEdit ? 'Your changes have been saved.' : 'The company was added to your database.');
      handleClose();
    },
    onError: () => setError(isEdit ? 'Failed to update company.' : 'Failed to add company.'),
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
      phone: form.phone.trim() || null,
      salesNumber: form.salesNumber.trim() || null,
      whatsappNumber: form.whatsappNumber.trim() || null,
      telegramTeams: form.telegramTeams.trim() || null,
      contactPersonName: form.contactPersonName.trim() || null,
      contactPersonPhone: form.contactPersonPhone.trim() || null,
      advertiserId: form.advertiserId.trim() || null,
      advertiserName: form.advertiserName.trim() || null,
      accountManagerName: form.accountManagerName.trim() || null,
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
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Company' : 'Add Company'}
      icon={<Building2 className="h-5 w-5 text-brand-600" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Name" required>
            <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Inc." required />
          </Field>
          <Field label="Type">
            <Select name="companyType" value={form.companyType} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="SaaS">SaaS</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Website">
            <Input name="website" value={form.website} onChange={handleChange} placeholder="https://acme.com" />
          </Field>
          <Field label="LinkedIn">
            <Input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} placeholder="linkedin.com/company/acme" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="info@acme.com" />
          </Field>
          <Field label="Industry">
            <Input name="industry" value={form.industry} onChange={handleChange} placeholder="SaaS" />
          </Field>
          <Field label="Employees">
            <Input name="employees" type="number" min={0} value={form.employees} onChange={handleChange} />
          </Field>
          <Field label="Followers">
            <Input name="followers" type="number" min={0} value={form.followers} onChange={handleChange} />
          </Field>
          <Field label="Base GEO">
            <Input name="baseGeo" value={form.baseGeo} onChange={handleChange} placeholder="USA" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lead Quality">
            <Select name="leadQuality" value={form.leadQuality} onChange={handleChange}>
              <option value="A">A (High)</option>
              <option value="B">B (Medium)</option>
              <option value="C">C (Low)</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
                    <Field label="Contact Person Name">
            <Input name="contactPersonName" value={form.contactPersonName} onChange={handleChange} />
          </Field>
          <Field label="Contact Person Phone">
            <Input name="contactPersonPhone" value={form.contactPersonPhone} onChange={handleChange} />
          </Field>
          <Field label="Advertiser ID">
            <Input name="advertiserId" value={form.advertiserId} onChange={handleChange} placeholder="e.g. ADV-1023" />
          </Field>
          <Field label="Advertiser Name">
            <Input name="advertiserName" value={form.advertiserName} onChange={handleChange} placeholder="e.g. Acme Advertising" />
          </Field>
          <Field label="Phone">
            <Input name="phone" value={form.phone} onChange={handleChange} />
          </Field>
          <Field label="Telegram / Teams">
            <Input name="telegramTeams" value={form.telegramTeams} onChange={handleChange} />
          </Field>
          <Field label="WhatsApp Number">
            <Input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} />
          </Field>
          <Field label="Sales Number">
            <Input name="salesNumber" value={form.salesNumber} onChange={handleChange} />
          </Field>
          <Field label="Affiliate Manager">
            <Input name="accountManagerName" value={form.accountManagerName} onChange={handleChange} placeholder="e.g. Anwesha Chakraborty" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lead Quality">
            <Select name="leadQuality" value={form.leadQuality} onChange={handleChange}>
              <option value="A">A (High)</option>
              <option value="B">B (Medium)</option>
              <option value="C">C (Low)</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
          <Field label="Address">
            <Input name="address" value={form.address} onChange={handleChange} />
          </Field>
          <Field label="Services">
            <Input name="services" value={form.services} onChange={handleChange} />
          </Field>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending} icon={isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>
            {isEdit ? 'Update' : 'Add Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}