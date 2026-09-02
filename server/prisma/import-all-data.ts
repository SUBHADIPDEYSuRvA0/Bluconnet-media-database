import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient();
const EXCEL_FILE = 'C:/Users/subha/Downloads/advertisers_2025-11-25-204204.csvCCC (1).xlsx';
const CSV_FILE = 'C:/Users/subha/Downloads/b2b-lead-platform/sample-companies-50.csv';

function parseSheetDate(v: any): Date | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    if (v <= 0) return null;
    if (v > 1e9 && v < 1e10) return new Date(v * 1000);
    if (v > 20000 && v < 60000) return new Date(Math.round((v - 25569) * 86400000));
    return null;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) { const [,d,mo,y,hh='0',mm='0'] = m; const dt = new Date(Date.UTC(+y,+mo-1,+d,+hh,+mm)); return isNaN(dt.getTime()) ? null : dt; }
  const fb = new Date(s); return isNaN(fb.getTime()) ? null : fb;
}

function mapStatus(raw: any) {
  const s = String(raw ?? '').trim();
  const st = s.toLowerCase().startsWith('act') ? 'ACTIVE' : s.toLowerCase().startsWith('inact') ? 'INACTIVE' : 'PENDING';
  return { status: st, statusRaw: s };
}

function parseCSVLine(line: string): string[] {
  const r: string[] = []; let cur = ''; let q = false;
  for (const c of line) { if (c === '"') q = !q; else if (c === ',' && !q) { r.push(cur.trim()); cur = ''; } else cur += c; }
  r.push(cur.trim()); return r;
}

function parseSampleCSV(fp: string): any[] {
  const lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  console.log('   CSV Headers: ' + headers.join(', '));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line); const rec: any = {};
    headers.forEach((h, i) => rec[h] = vals[i] || '');
    return rec;
  });
}

async function main() {
  console.log('=== Starting Full Database Import ===\n');
  const admin = await prisma.user.findUnique({ where: { email: 'admin@bluconnetmedia.com' } });
  if (!admin) throw new Error('Admin user not found - run seed first');
  console.log('Admin: ' + admin.name + ' (' + admin.email + ')\n');

  console.log('1) Clearing database...');
  await prisma.auditLog.deleteMany({});
  await prisma.importLog.deleteMany({});
  const del = await prisma.company.deleteMany({});
  console.log('   Removed ' + del.count + ' companies.\n');

  // Import CSV (all fields)
  console.log('2) Importing sample-companies-50.csv...');
  const csvRecords = parseSampleCSV(CSV_FILE);
  console.log('   Found ' + csvRecords.length + ' records.');
  let csvIns = 0;
  for (const rec of csvRecords) {
    const name = String(rec['Company Name'] ?? '').trim();
    if (!name) continue;
    if (await prisma.company.findFirst({ where: { companyName: name } })) { console.log('   Skip dup: ' + name); continue; }
    await prisma.company.create({
      data: {
        companyName: name,
        website: String(rec['Website'] ?? '').trim() || null,
        linkedinUrl: String(rec['LinkedIn Link'] ?? '').trim() || null,
        email: String(rec['Mail ID'] ?? '').trim() || null,
        employees: Number(rec['Employees']) || null,
        followers: Number(rec['Followers']) || null,
        companyType: String(rec['Type'] ?? '').trim() || null,
        baseGeo: String(rec['Base GEO'] ?? '').trim() || null,
        address: String(rec['Address'] ?? '').trim() || null,
        services: String(rec['Services'] ?? '').trim() || null,
        status: 'ACTIVE', statusRaw: 'Imported from sample CSV',
        source: 'Sample CSV (50 companies)',
        addedById: admin.id, lastModifiedById: admin.id,
      },
    });
    csvIns++;
  }
  console.log('   Inserted ' + csvIns + ' from CSV.\n');


  // Import Excel (785 rows)
  console.log('3) Importing Excel file...');
  const wb = XLSX.readFile(EXCEL_FILE);
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  console.log('   Found ' + rows.length + ' rows.');
  let exIns = 0, exSkip = 0;
  for (const r of rows) {
    const extId = Number(r['Id']) || null;
    const name = String(r['Company'] ?? '').trim();
    if (!name) { exSkip++; continue; }
    const existing = await prisma.company.findFirst({ where: { companyName: name } });
    if (existing) {
      const upd: any = {};
      if (!existing.phone && r['Phone']) upd.phone = String(r['Phone']).trim();
      if (!existing.city && r['City']) upd.city = String(r['City']).trim();
      if (!existing.state && r['Region']) upd.state = String(r['Region']).trim();
      if (!existing.country && r['Country']) upd.country = String(r['Country']).trim();
      if (!existing.address1 && r['Address 1']) upd.address1 = String(r['Address 1']).trim();
      if (!existing.address2 && r['Address 2']) upd.address2 = String(r['Address 2']).trim();
      if (!existing.zipcode && r['Zipcode']) upd.zipcode = String(r['Zipcode']).trim();
      if (!existing.otherInfo && r['Other']) upd.otherInfo = String(r['Other']).trim();
      if (Object.keys(upd).length > 0) { upd.lastModifiedById = admin.id; await prisma.company.update({ where: { id: existing.id }, data: upd }); }
      exSkip++; continue;
    }
    const { status, statusRaw } = mapStatus(r['Status']);
    await prisma.company.create({
      data: {
        externalId: extId, companyName: name, status, statusRaw: statusRaw || null,
        phone: String(r['Phone'] ?? '').trim() || null,
        address1: String(r['Address 1'] ?? '').trim() || null,
        address2: String(r['Address 2'] ?? '').trim() || null,
        city: String(r['City'] ?? '').trim() || null,
        state: String(r['Region'] ?? '').trim() || null,
        country: String(r['Country'] ?? '').trim() || null,
        zipcode: String(r['Zipcode'] ?? '').trim() || null,
        otherInfo: String(r['Other'] ?? '').trim() || null,
        recordCreated: parseSheetDate(r['Date Created']),

  await prisma.importLog.create({
    data: {
      fileName: 'Combined: sample-companies-50.csv + advertisers_2025-11-25.xlsx',
      userId: admin.id, totalRows: csvRecords.length + rows.length,
      imported: csvIns + exIns, updated: exSkip, duplicates: exSkip, failed: 0, status: 'SUCCESS',
    },
  });

  const total = await prisma.company.count();
  console.log('=== Import Complete ===');
  console.log('Total companies: ' + total + ' (CSV: ' + csvIns + ', Excel: ' + exIns + ', Skipped: ' + exSkip + ')');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

        recordModified: parseSheetDate(r['Last Modified']),
        signupIp: String(r['Signup IP'] ?? '').trim() || null,
        accountManagerId: Number(r['Account Manager ID']) || null,
        accountManagerName: String(r['Account Manager'] ?? '').trim() || null,
        source: 'Excel Import (advertisers 2025-11-25)',
        addedById: admin.id, lastModifiedById: admin.id,
      },
    });
    exIns++;
  }
  console.log('   Inserted ' + exIns + ' from Excel. Skipped ' + exSkip + '.\n');

