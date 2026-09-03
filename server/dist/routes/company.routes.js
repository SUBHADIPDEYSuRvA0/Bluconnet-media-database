"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const company_controller_1 = require("../controllers/company.controller");
const import_controller_1 = require("../controllers/import.controller");
const router = (0, express_1.Router)();
const maxSize = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // default 5MB
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: maxSize },
});
router.get('/', auth_1.authenticate, company_controller_1.getCompanies);
router.get('/account-managers', auth_1.authenticate, company_controller_1.getAccountManagers);
router.get('/export', auth_1.authenticate, company_controller_1.exportCompanies);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'DATA_MANAGER', 'EMPLOYEE'), company_controller_1.createCompany);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'DATA_MANAGER'), company_controller_1.updateCompany);
router.patch('/:id/status', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'DATA_MANAGER'), company_controller_1.updateCompanyStatus);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'DATA_MANAGER'), company_controller_1.deleteCompany);
router.post('/import', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'DATA_MANAGER'), upload.single('file'), import_controller_1.importCompanies);
router.get('/import/logs', auth_1.authenticate, import_controller_1.getImportLogs);
exports.default = router;
