"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCompanies = exports.updateCompanyStatus = exports.createCompany = exports.getCompanies = void 0;
const index_1 = require("../index");
function buildWhere(req) {
    const { search, country, industry, status, leadQuality, companyType, city, state } = req.query;
    const where = {};
    if (search)
        where.OR = [
            { companyName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { salesNumber: { contains: search } }
        ];
    if (country)
        where.country = country;
    if (city)
        where.city = city;
    if (state)
        where.state = state;
    if (industry)
        where.industry = industry;
    if (status)
        where.status = status;
    if (leadQuality)
        where.leadQuality = leadQuality;
    if (companyType)
        where.companyType = companyType;
    // RBAC: Employees only see their own (simplified to own for this demo)
    if (req.user?.role === 'EMPLOYEE') {
        where.addedById = req.user.id;
    }
    return where;
}
const getCompanies = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = buildWhere(req);
        const [companies, total] = await Promise.all([
            index_1.prisma.company.findMany({
                where,
                skip,
                take: Number(limit),
                include: { addedBy: { select: { name: true } }, lastModifiedBy: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            index_1.prisma.company.count({ where })
        ]);
        res.json({ success: true, data: companies, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
exports.getCompanies = getCompanies;
const createCompany = async (req, res) => {
    try {
        const data = req.body;
        const company = await index_1.prisma.company.create({
            data: {
                ...data,
                addedById: req.user.id,
                lastModifiedById: req.user.id,
            },
            include: { addedBy: { select: { name: true } } }
        });
        await index_1.prisma.auditLog.create({
            data: { userId: req.user.id, companyId: company.id, action: 'CREATE', fieldName: 'ALL', newValue: JSON.stringify(data) }
        });
        res.status(201).json({ success: true, data: company });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create company' });
    }
};
exports.createCompany = createCompany;
const updateCompanyStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const oldCompany = await index_1.prisma.company.findUnique({ where: { id } });
        const updated = await index_1.prisma.company.update({
            where: { id },
            data: { status, lastModifiedById: req.user.id }
        });
        await index_1.prisma.auditLog.create({
            data: { userId: req.user.id, companyId: id, action: 'STATUS_CHANGE', fieldName: 'status', oldValue: oldCompany?.status, newValue: status }
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
};
exports.updateCompanyStatus = updateCompanyStatus;
// CSV-safe formatting
const csvVal = (v) => {
    if (v === null || v === undefined)
        return '';
    const s = String(v);
    if (/[",\n]/.test(s))
        return '"' + s.replace(/"/g, '""') + '"';
    return s;
};
/**
 * Exports all companies (respecting filters + RBAC) as a downloadable CSV file.
 */
const exportCompanies = async (req, res) => {
    try {
        const where = buildWhere(req);
        const companies = await index_1.prisma.company.findMany({
            where,
            include: { addedBy: { select: { name: true } }, lastModifiedBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const headers = [
            'Id', 'Company Name', 'Status', 'Original Status', 'Address 1', 'Address 2', 'City',
            'Region', 'Country', 'Other', 'Zipcode', 'Phone', 'Signup IP',
            'Account Manager ID', 'Account Manager', 'Date Created', 'Last Modified',
            'Website', 'LinkedIn Link', 'Mail ID', 'Sales Number', 'WhatsApp Number',
            'Employees', 'Followers', 'Type', 'Industry', 'Base GEO',
            'Address', 'Services', 'Revenue', 'Company Size', 'Technologies Used', 'Target Market',
            'Lead Quality', 'Source',
            'Added By', 'Added Date', 'Last Modified By', 'Last Modified Date',
        ];
        const rows = companies.map((c) => [
            c.externalId,
            c.companyName,
            c.status,
            c.statusRaw,
            c.address1,
            c.address2,
            c.city,
            c.state,
            c.country,
            c.otherInfo,
            c.zipcode,
            c.phone,
            c.signupIp,
            c.accountManagerId,
            c.accountManagerName,
            c.recordCreated ? new Date(c.recordCreated).toISOString() : '',
            c.recordModified ? new Date(c.recordModified).toISOString() : '',
            c.website,
            c.linkedinUrl,
            c.email,
            c.salesNumber,
            c.whatsappNumber,
            c.employees,
            c.followers,
            c.companyType,
            c.industry,
            c.baseGeo,
            c.address,
            c.services,
            c.revenue,
            c.companySize,
            c.technologiesUsed,
            c.targetMarket,
            c.leadQuality,
            c.source,
            c.addedBy?.name,
            c.createdAt ? c.createdAt.toISOString() : '',
            c.lastModifiedBy?.name,
            c.updatedAt ? c.updatedAt.toISOString() : '',
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map(csvVal).join(','))].join('\n');
        // Record an EXPORT audit entry
        try {
            await index_1.prisma.auditLog.create({
                data: { userId: req.user.id, action: 'EXPORT', fieldName: 'ALL', newValue: `${companies.length} rows` },
            });
        }
        catch { /* non-fatal */ }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="companies-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM for Excel compatibility
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
};
exports.exportCompanies = exportCompanies;
