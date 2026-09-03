"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCompanies = exports.deleteCompany = exports.updateCompany = exports.updateCompanyStatus = exports.createCompany = exports.getCompanies = exports.getAccountManagers = void 0;
const index_1 = require("../index");
function buildWhere(req) {
    const { search, country, industry, status, leadQuality, companyType, city, state, accountManager } = req.query;
    const where = {};
    if (search) {
        const term = search;
        where.OR = [
            { companyName: { contains: term, mode: 'insensitive' } },
            { advertiserName: { contains: term, mode: 'insensitive' } },
            { advertiserId: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { website: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { salesNumber: { contains: term, mode: 'insensitive' } },
            { whatsappNumber: { contains: term, mode: 'insensitive' } },
            { telegramTeams: { contains: term, mode: 'insensitive' } },
            { linkedinUrl: { contains: term, mode: 'insensitive' } },
            { country: { contains: term, mode: 'insensitive' } },
            { city: { contains: term, mode: 'insensitive' } },
            { state: { contains: term, mode: 'insensitive' } },
            { address: { contains: term, mode: 'insensitive' } },
            { services: { contains: term, mode: 'insensitive' } },
            { accountManagerName: { contains: term, mode: 'insensitive' } },
            { companyType: { contains: term, mode: 'insensitive' } },
            { baseGeo: { contains: term, mode: 'insensitive' } },
            { industry: { contains: term, mode: 'insensitive' } },
        ];
    }
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
    if (accountManager)
        where.accountManagerName = accountManager;
    // RBAC: Employees only see their own (simplified to own for this demo)
    if (req.user?.role === 'EMPLOYEE') {
        where.addedById = req.user.id;
    }
    return where;
}
// Returns the distinct set of affiliate / account managers for the filter dropdown.
const getAccountManagers = async (req, res) => {
    try {
        const managers = await index_1.prisma.company.findMany({
            where: { accountManagerName: { not: null } },
            select: { accountManagerName: true, accountManagerId: true },
            distinct: ['accountManagerName'],
            orderBy: { accountManagerName: 'asc' },
        });
        res.json({ success: true, data: managers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch account managers' });
    }
};
exports.getAccountManagers = getAccountManagers;
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
// Update company (full edit)
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const company = await index_1.prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        const updated = await index_1.prisma.company.update({
            where: { id },
            data: { ...data, lastModifiedById: req.user.id },
            include: { addedBy: { select: { name: true } }, lastModifiedBy: { select: { name: true } } },
        });
        await index_1.prisma.auditLog.create({
            data: { userId: req.user.id, companyId: id, action: 'UPDATE', fieldName: 'ALL', newValue: JSON.stringify(data) },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update company' });
    }
};
exports.updateCompany = updateCompany;
// Delete company
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await index_1.prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        await index_1.prisma.company.delete({ where: { id } });
        await index_1.prisma.auditLog.create({
            data: { userId: req.user.id, companyId: id, action: 'DELETE', fieldName: 'ALL', oldValue: company.companyName },
        });
        res.json({ success: true, message: 'Company deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete company' });
    }
};
exports.deleteCompany = deleteCompany;
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
