import { Response } from 'express';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Map common header names (normalized) to Prisma Company fields.
const FIELD_ALIASES: Record<string, string> = {
  id: 'externalId',
  recordid: 'externalId',
  address1: 'address1',
  address2: 'address2',
  zipcode: 'zipcode',
  zip: 'zipcode',
  postalcode: 'zipcode',
  region: 'state',
  state: 'state',
  other: 'otherInfo',
  phone: 'phone',
  phonenumber2: 'phone',
  signupip: 'signupIp',
  ip: 'signupIp',
  accountmanager: 'accountManagerName',
  accountmanagerid: 'accountManagerId',
  datecreated: 'recordCreated',
  createddate: 'recordCreated',
  lastmodified: 'recordModified',
  modifieddate: 'recordModified',
  companyname: 'companyName',
  company: 'companyName',
  name: 'companyName',
  businessname: 'companyName',
  organisation: 'companyName',
  website: 'website',
  url: 'website',
  linkedin: 'linkedinUrl',
  linkedinlink: 'linkedinUrl',
  linkedinurl: 'linkedinUrl',
  email: 'email',
  emailid: 'email',
  mailid: 'email',
  mail: 'email',
  salesnumber: 'salesNumber',
  salesphone: 'salesNumber',
  whatsappnumber: 'whatsappNumber',
  whatsapp: 'whatsappNumber',
  whatsappverified: 'whatsappVerified',
  employees: 'employees',
  employee: 'employees',
  employeecount: 'employees',
  followers: 'followers',
  type: 'companyType',
  companytype: 'companyType',
  industry: 'industry',
  basegeo: 'baseGeo',
  geocountry: 'country',
  country: 'country',
  city: 'city',
  address: 'address',
  services: 'services',
  revenue: 'revenue',
  companysize: 'companySize',
  size: 'companySize',
  technologiesused: 'technologiesUsed',
  technology: 'technologiesUsed',
  technologies: 'technologiesUsed',
  targetmarket: 'targetMarket',
  status: 'status',
  leadquality: 'leadQuality',
  quality: 'leadQuality',
  source: 'source',
  gdpr: 'complianceGdpr',
  compliancegdpr: 'complianceGdpr',
  ccpa: 'complianceCcpa',
  complianceccpa: 'complianceCcpa',
  optin: 'optIn',
  donotcontact: 'doNotContact',
  dnc: 'doNotContact',
};

// Fields that are safely writable on a Company during import.
const WRITABLE_FIELDS = new Set<string>([
  'companyName', 'website', 'linkedinUrl', 'email', 'salesNumber', 'whatsappNumber',
  'whatsappVerified', 'employees', 'followers', 'companyType', 'industry', 'baseGeo',
  'country', 'state', 'city', 'address', 'services', 'revenue', 'companySize',
  'technologiesUsed', 'targetMarket', 'leadQuality', 'status', 'source',
  'complianceGdpr', 'complianceCcpa', 'optIn', 'doNotContact',
  'externalId', 'address1', 'address2', 'zipcode', 'otherInfo', 'phone',
  'signupIp', 'accountManagerId', 'accountManagerName',
]);

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseBoolean = (v: any): boolean | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'active', 'verified'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'inactive'].includes(s)) return false;
  return undefined;
};

const parseLeadQuality = (v: any): 'A' | 'B' | 'C' | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim().toUpperCase();
  if (s.startsWith('A')) return 'A';
  if (s.startsWith('B')) return 'B';
  if (s.startsWith('C')) return 'C';
  return undefined;
};

const parseStatus = (v: any): 'ACTIVE' | 'INACTIVE' | 'PENDING' | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim().toUpperCase();
  if (s.startsWith('ACT')) return 'ACTIVE';
  if (s.startsWith('IN')) return 'INACTIVE';
  if (s.startsWith('PEN')) return 'PENDING';
  return undefined;
};

const clampInt = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
/**
 * Normalizes a flat row object (keyed by header) into a Company-shaped object.
 * Keys that don't map to a known field are ignored. Returns null if no company
 * name could be determined.
 */
function mapRow(row: any): any {
  const mapped: Record<string, any> = {};
  for (const [rawKey, rawValue] of Object.entries(row)) {
    if (rawValue === undefined || rawValue === null) continue;
    const field = FIELD_ALIASES[normalizeKey(rawKey)];
    if (!field || !WRITABLE_FIELDS.has(field)) continue;

    if (field === 'employees' || field === 'followers') {
      const n = clampInt(rawValue);
      if (n !== undefined) mapped[field] = n;
    } else if (field === 'leadQuality') {
      const q = parseLeadQuality(rawValue);
      if (q) mapped[field] = q;
    } else if (field === 'status') {
      const s = parseStatus(rawValue);
      if (s) mapped[field] = s;
    } else if (field === 'whatsappVerified' || field === 'complianceGdpr' || field === 'complianceCcpa' || field === 'optIn' || field === 'doNotContact') {
      const b = parseBoolean(rawValue);
      if (b !== undefined) mapped[field] = b;
    } else {
      const s = String(rawValue).trim();
      if (s) mapped[field] = s;
    }
  }

  const companyName = mapped.companyName;
  if (!companyName) return null;
  return mapped;
}
export const getImportLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.importLog.findMany({
      where: req.user?.role === 'EMPLOYEE' ? { userId: req.user.id } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load import logs', error: (error as Error).message });
  }
};

export const importCompanies = async (req: AuthRequest, res: Response) => {
  const file = (req as any).file;
  const action = req.query.duplicateAction === 'update' ? 'update' : 'skip';

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filename = file.originalname || 'upload';
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  try {
    let rows: any[] = [];

    if (ext === 'csv') {
      const text = file.buffer.toString('utf8');
      rows = parseCsv(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true,
      });
    } else if (['xlsx', 'xls'].includes(ext)) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type. Please upload a .csv, .xlsx, or .xls file.' });
    }

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'The file contained no data rows.' });
    }

    const totalRows = rows.length;
    let imported = 0;
    let updated = 0;
    let duplicates = 0;
    let failed = 0;
    const failedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mapped = mapRow(row);
      if (!mapped) {
        failed++;
        failedRows.push({ row: i + 2, reason: 'Missing company name' });
        continue;
      }

      // Build duplicate-detection query (name / email / phone / whatsapp).
      const OR: any[] = [{ companyName: { equals: mapped.companyName, mode: 'insensitive' } }];
      if (mapped.email) OR.push({ email: { equals: mapped.email, mode: 'insensitive' } });
      if (mapped.salesNumber) OR.push({ salesNumber: { equals: mapped.salesNumber } });
      if (mapped.whatsappNumber) OR.push({ whatsappNumber: { equals: mapped.whatsappNumber } });

      const existing = await prisma.company.findFirst({ where: { OR } });

      if (existing) {
        if (action === 'update') {
          await prisma.company.update({
            where: { id: existing.id },
            data: { ...mapped, lastModifiedById: req.user!.id },
          });
          await prisma.auditLog.create({
            data: { userId: req.user!.id, companyId: existing.id, action: 'UPDATE', fieldName: 'IMPORT', newValue: JSON.stringify(mapped) },
          });
          updated++;
        } else {
          duplicates++;
        }
        continue;
      }

      await prisma.company.create({
        data: { ...mapped, addedById: req.user!.id, lastModifiedById: req.user!.id, source: mapped.source || 'Import' },
      });
      imported++;
    }

    const status = failed > 0 ? (imported + updated > 0 ? 'PARTIAL' : 'FAILED') : 'SUCCESS';

    const importLog = await prisma.importLog.create({
      data: {
        fileName: filename,
        userId: req.user!.id,
        totalRows,
        imported,
        updated,
        duplicates,
        failed,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'IMPORT',
        fieldName: filename,
        newValue: JSON.stringify({ totalRows, imported, updated, duplicates, failed }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Import completed',
      data: { id: importLog.id, fileName: filename, totalRows, imported, updated, duplicates, failed, status },
      failedRows: failedRows.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process file', error: (error as Error).message });
  }
};