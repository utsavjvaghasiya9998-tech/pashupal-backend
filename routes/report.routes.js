import { Router } from "express";
import { isAdmin } from "../middleware/isAdmin.js";
import { isLogin } from "../middleware/auth.js";

import {
  milkReport,
  salesReport,
  dueReport,

  exportMilkReportPDF,
  exportMilkReportCSV,

  exportSalesReportPDF,
  exportSalesReportCSV,

  exportDueReportPDF,
  exportDueReportCSV,

    expenseReport,
    exportExpenseReportCSV,
    exportExpenseReportPDF

} from "../controller/reportController.js";

const router = Router();

// ===== NORMAL REPORT APIs =====
router.get("/milk", isLogin, isAdmin, milkReport);
router.get("/sales", isLogin, isAdmin, salesReport);
router.get("/due", isLogin, isAdmin, dueReport);
router.get("/expense", isLogin, isAdmin, expenseReport);

// ===== EXPORT APIs =====

// MILK
router.get("/milk/pdf", isLogin, isAdmin, exportMilkReportPDF);
router.get("/milk/csv", isLogin, isAdmin, exportMilkReportCSV);

// SALES
router.get("/sales/pdf", isLogin, isAdmin, exportSalesReportPDF);
router.get("/sales/csv", isLogin, isAdmin, exportSalesReportCSV);

// DUE
router.get("/due/pdf", isLogin, isAdmin, exportDueReportPDF);
router.get("/due/csv", isLogin, isAdmin, exportDueReportCSV);

router.get("/expense/csv", isLogin, isAdmin, exportExpenseReportCSV);
router.get("/expense/pdf", isLogin, isAdmin, exportExpenseReportPDF);

export default router;
