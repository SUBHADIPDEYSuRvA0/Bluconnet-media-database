"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCompanies = exports.getImportLogs = void 0;
const XLSX = __importStar(require("xlsx"));
const sync_1 = require("csv-parse/sync");
const index_1 = require("../index");
// Map common header names (normalized) to Prisma Company fields.
const FIELD_ALIASES = {
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
    contactpersonphonenumber: 'contactPersonPhone',
    contactpersonphone: 'contactPersonPhone',
    contactname: 'contactPersonName',
    contactpersonname: 'contactPersonName',
    advertiserid: 'advertiserId',
    advertisername: 'advertiserName',
    advertiser: 'advertiserName',
    telegram: 'telegramTeams',
    teams: 'telegramTeams',
    telegramteams: 'telegramTeams',
};
// Fields that are safely writable on a Company during import.
const WRITABLE_FIELDS = new Set([
    'companyName', 'website', 'linkedinUrl', 'email', 'salesNumber', 'whatsappNumber',
    'whatsappVerified', 'employees', 'followers', 'companyType', 'industry', 'baseGeo',
    'country', 'state', 'city', 'address', 'services', 'revenue', 'companySize',
    'technologiesUsed', 'targetMarket', 'leadQuality', 'status', 'source',
    'complianceGdpr', 'complianceCcpa', 'optIn', 'doNotContact',
    'externalId', 'address1', 'address2', 'zipcode', 'otherInfo', 'phone',
    'signupIp', 'accountManagerId', 'accountManagerName',
    'contactPersonName', 'contactPersonPhone', 'telegramTeams',
    'advertiserId', 'advertiserName', 'recordCreated', 'recordModified',
]);
const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
const parseBoolean = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    if (typeof v === 'boolean')
        return v;
    const s = String(v).trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'active', 'verified'].includes(s))
        return true;
    if (['false', 'no', 'n', '0', 'inactive'].includes(s))
        return false;
    return undefined;
};
const parseLeadQuality = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    const s = String(v).trim().toUpperCase();
    if (s.startsWith('A'))
        return 'A';
    if (s.startsWith('B'))
        return 'B';
    if (s.startsWith('C'))
        return 'C';
    return undefined;
};
const parseStatus = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    const s = String(v).trim().toUpperCase();
    if (s.startsWith('ACT'))
        return 'ACTIVE';
    if (s.startsWith('IN'))
        return 'INACTIVE';
    if (s.startsWith('PEN'))
        return 'PENDING';
    return undefined;
};
const clampInt = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    const n = Number(String(v).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : undefined;
};
// Fields stored as integers in the DB — blanks stay null (never 'N/A').
const INT_FIELDS = new Set(['externalId', 'accountManagerId', 'employees', 'followers']);
// Fields stored as booleans — blanks stay undefined.
const BOOLEAN_FIELDS = new Set(['whatsappVerified', 'complianceGdpr', 'complianceCcpa', 'optIn', 'doNotContact']);
// Fields stored as DateTime — parsed from sheet values.
const DATE_FIELDS = new Set(['recordCreated', 'recordModified']);
/** Accepts a parsed Date only if it's real and within a sane range (1970-2100). */
const sane = (d) => {
    if (isNaN(d.getTime()))
        return null;
    const y = d.getFullYear();
    return y >= 1970 && y <= 2100 ? d : null;
};
/**
 * Converts messy spreadsheet date values into real Dates.
 * Handles: epoch seconds, Excel serial days, "DD-MM-YYYY HH:mm", ISO strings.
 * Junk numbers (phones, ids, negative epochs) resolve to null, never a bogus year.
 */
function parseSheetDate(v) {
    if (v === undefined || v === null || v === '')
        return null;
    // Numeric cells / numeric strings ("45627", "-62169984000", 1733394356…).
    const num = typeof v === 'number' ? v : /^\d+(\.\d+)?$/.test(String(v).trim()) ? Number(String(v).trim()) : null;
    if (num !== null) {
        if (num <= 0)
            return null;
        if (num > 1e9 && num < 4.1e9)
            return sane(new Date(num * 1000)); // epoch seconds
        if (num >= 25569 && num < 60000) { // Excel serial (days since 1899-12-30)
            return sane(new Date(Math.round((num - 25569) * 86400000)));
        }
        return null;
    }
    const s = String(v).trim();
    // "21-05-2024 09:38"  (DD-MM-YYYY HH:mm)
    const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) {
        const [, d, mo, y, hh = '0', mm = '0'] = m;
        return sane(new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm)));
    }
    return sane(new Date(s));
}
// Fields that never get the 'N/A' fill (enums with DB defaults, or the row key).
const SKIP_NA_FIELDS = new Set(['companyName', 'status', 'leadQuality', 'source']);
/**
 * Normalizes a flat row object (keyed by header) into a Company-shaped object.
 *
 * - Blank cells in text fields become 'N/A' (fresh imports only; updates skip them).
 * - Int / boolean / date / enum fields are type-converted; blanks stay empty.
 * - Columns that don't match any known header are preserved in `otherInfo`
 *   ("Header: value | Header: value") so no sheet data is ever lost.
 * - Rows without a company name fall back to advertiser name, then a row label.
 */
function mapRow(row, rowNumber = 0, action = 'skip') {
    const mapped = {};
    const extras = [];
    for (const [rawKey, rawValue] of Object.entries(row)) {
        const key = normalizeKey(rawKey);
        const field = FIELD_ALIASES[key];
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();
        // Unknown column → keep its data instead of dropping it.
        if (!field || !WRITABLE_FIELDS.has(field)) {
            if (key && value)
                extras.push(`${rawKey}: ${value}`);
            continue;
        }
        if (DATE_FIELDS.has(field)) {
            const d = parseSheetDate(value);
            if (d)
                mapped[field] = d;
        }
        else if (INT_FIELDS.has(field)) {
            const n = clampInt(value);
            if (n !== undefined)
                mapped[field] = n;
        }
        else if (BOOLEAN_FIELDS.has(field)) {
            const b = parseBoolean(value);
            if (b !== undefined)
                mapped[field] = b;
        }
        else if (field === 'status') {
            const s = parseStatus(value);
            if (s)
                mapped[field] = s;
        }
        else if (field === 'leadQuality') {
            const q = parseLeadQuality(value);
            if (q)
                mapped[field] = q;
        }
        else if (value) {
            mapped[field] = value;
        }
        else if (action === 'skip' && !SKIP_NA_FIELDS.has(field)) {
            mapped[field] = 'N/A'; // fill blank text cells on fresh imports
        }
    }
    if (extras.length) {
        const extra = extras.join(' | ');
        mapped.otherInfo = mapped.otherInfo && mapped.otherInfo !== 'N/A'
            ? `${mapped.otherInfo} | ${extra}`
            : extra;
    }
    // Best-effort company name so no row is silently dropped.
    if (!mapped.companyName) {
        mapped.companyName =
            mapped.advertiserName && mapped.advertiserName !== 'N/A'
                ? mapped.advertiserName
                : `Unnamed Company (Row ${rowNumber})`;
    }
    return mapped;
}
const getImportLogs = async (req, res) => {
    try {
        const logs = await index_1.prisma.importLog.findMany({
            where: req.user?.role === 'EMPLOYEE' ? { userId: req.user.id } : undefined,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.json({ success: true, data: logs });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to load import logs', error: error.message });
    }
};
exports.getImportLogs = getImportLogs;
const importCompanies = async (req, res) => {
    const file = req.file;
    const action = req.query.duplicateAction === 'update' ? 'update' : 'skip';
    if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const filename = file.originalname || 'upload';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    try {
        let rows = [];
        if (ext === 'csv') {
            const text = file.buffer.toString('utf8');
            rows = (0, sync_1.parse)(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
                bom: true,
            });
        }
        else if (['xlsx', 'xls'].includes(ext)) {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        }
        else {
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
        const failedRows = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const mapped = mapRow(row, i + 2, action);
            // Build duplicate-detection query (name / email / phone / whatsapp).
            const OR = [{ companyName: { equals: mapped.companyName, mode: 'insensitive' } }];
            if (mapped.email)
                OR.push({ email: { equals: mapped.email, mode: 'insensitive' } });
            if (mapped.salesNumber)
                OR.push({ salesNumber: { equals: mapped.salesNumber } });
            if (mapped.whatsappNumber)
                OR.push({ whatsappNumber: { equals: mapped.whatsappNumber } });
            const existing = await index_1.prisma.company.findFirst({ where: { OR } });
            if (existing) {
                if (action === 'update') {
                    // Never overwrite real data with the 'N/A' blank marker.
                    const clean = {};
                    for (const [k, v] of Object.entries(mapped)) {
                        if (v === 'N/A')
                            continue;
                        clean[k] = v;
                    }
                    await index_1.prisma.company.update({
                        where: { id: existing.id },
                        data: { ...clean, lastModifiedById: req.user.id },
                    });
                    await index_1.prisma.auditLog.create({
                        data: { userId: req.user.id, companyId: existing.id, action: 'UPDATE', fieldName: 'IMPORT', newValue: JSON.stringify(clean) },
                    });
                    updated++;
                }
                else {
                    duplicates++;
                }
                continue;
            }
            await index_1.prisma.company.create({
                data: { ...mapped, addedById: req.user.id, lastModifiedById: req.user.id, source: mapped.source || 'Import' },
            });
            imported++;
        }
        const status = failed > 0 ? (imported + updated > 0 ? 'PARTIAL' : 'FAILED') : 'SUCCESS';
        const importLog = await index_1.prisma.importLog.create({
            data: {
                fileName: filename,
                userId: req.user.id,
                totalRows,
                imported,
                updated,
                duplicates,
                failed,
                status,
            },
        });
        await index_1.prisma.auditLog.create({
            data: {
                userId: req.user.id,
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
    }
    catch (error) {
        console.error('Import error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process file', error: error.message });
    }
};
exports.importCompanies = importCompanies;
