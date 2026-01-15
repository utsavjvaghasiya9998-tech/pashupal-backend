import MilkRecord from "../models/MilkRecord.js";
import MilkSale from "../models/MilkSale.js";
import Expense from "../models/Expense.js";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";

/* =====================================================
   🥛 MILK REPORT (JSON)
===================================================== */
export const milkReport = async (req, res) => {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) {
        filter.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    const data = await MilkRecord.find(filter).populate("animal");
    const totalMilk = data.reduce((sum, i) => sum + (i.totalYield || 0), 0);

    res.json({ success: true, totalMilk, data });
};

/* =====================================================
   🥛 MILK CSV
===================================================== */
export const exportMilkReportCSV = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await MilkRecord.find(filter).populate("animal");

        const data = records.map(r => ({
            Date: new Date(r.date).toLocaleDateString(),
            Animal: r.animal?.tagId || "",
            Morning: r.morningYield || 0,
            Evening: r.eveningYield || 0,
            Total: r.totalYield || 0,
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=milk-report.csv");
        res.send(csv);
    } catch (err) {
        console.error("MILK CSV ERROR:", err);
        res.status(500).json({ success: false, message: "Milk CSV export failed" });
    }
};

/* =====================================================
   🥛 MILK PDF
===================================================== */
export const exportMilkReportPDF = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await MilkRecord.find(filter).populate("animal");

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=milk-report.pdf");
        doc.pipe(res);

        doc.fontSize(20).text("Milk Production Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text("Date | Animal | Morning | Evening | Total");
        doc.moveDown(0.5);

        records.forEach(r => {
            doc.text(
                `${new Date(r.date).toLocaleDateString()} | ${r.animal?.tagId || "-"} | ${r.morningYield || 0} | ${r.eveningYield || 0} | ${r.totalYield || 0}`
            );
        });

        doc.end();
    } catch (err) {
        console.error("MILK PDF ERROR:", err);
        res.status(500).json({ success: false, message: "Milk PDF export failed" });
    }
};

/* =====================================================
   💰 SALES REPORT (JSON)
===================================================== */
export const salesReport = async (req, res) => {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

    const data = await MilkSale.find(filter).populate("user");

    let totalAmount = 0;
    let totalQuantity = 0;

    data.forEach(i => {
        totalAmount += i.totalPrice || 0;
        totalQuantity += i.quantity || 0;
    });

    res.json({ success: true, totalAmount, totalQuantity, data });
};

/* =====================================================
   💰 SALES CSV
===================================================== */
export const exportSalesReportCSV = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await MilkSale.find(filter).populate("user");

        const data = records.map(r => ({
            Date: new Date(r.date).toLocaleDateString(),
            Customer: r.user?.name || "",
            Quantity: r.quantity || 0,
            PricePerLiter: r.pricePerLiter || 0,
            Total: r.totalPrice || 0,
            Status: r.paymentStatus || "",
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=sales-report.csv");
        res.send(csv);
    } catch (err) {
        console.error("SALES CSV ERROR:", err);
        res.status(500).json({ success: false, message: "Sales CSV export failed" });
    }
};

/* =====================================================
   💰 SALES PDF
===================================================== */
export const exportSalesReportPDF = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await MilkSale.find(filter).populate("user");

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
        doc.pipe(res);

        doc.fontSize(20).text("Milk Sales Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text("Date | Customer | Qty | Price/L | Total | Status");
        doc.moveDown(0.5);

        records.forEach(r => {
            doc.text(
                `${new Date(r.date).toLocaleDateString()} | ${r.user?.name || "-"} | ${r.quantity || 0} | ${r.pricePerLiter || 0} | ${r.totalPrice || 0} | ${r.paymentStatus}`
            );
        });

        doc.end();
    } catch (err) {
        console.error("SALES PDF ERROR:", err);
        res.status(500).json({ success: false, message: "Sales PDF export failed" });
    }
};

/* =====================================================
   ⚠️ DUE REPORT (JSON)
===================================================== */
export const dueReport = async (req, res) => {
    const data = await MilkSale.find({ paymentStatus: "unpaid" }).populate("user");

    let totalDue = 0;
    data.forEach(i => totalDue += i.totalPrice || 0);

    res.json({ success: true, totalDue, data });
};

/* =====================================================
   ⚠️ DUE CSV
===================================================== */
export const exportDueReportCSV = async (req, res) => {
    try {
        const records = await MilkSale.find({ paymentStatus: "unpaid" }).populate("user");

        const data = records.map(r => ({
            Date: new Date(r.date).toLocaleDateString(),
            Customer: r.user?.name || "",
            Quantity: r.quantity || 0,
            Total: r.totalPrice || 0,
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=due-report.csv");
        res.send(csv);
    } catch (err) {
        console.error("DUE CSV ERROR:", err);
        res.status(500).json({ success: false, message: "Due CSV export failed" });
    }
};

/* =====================================================
   ⚠️ DUE PDF
===================================================== */
export const exportDueReportPDF = async (req, res) => {
    try {
        const records = await MilkSale.find({ paymentStatus: "unpaid" }).populate("user");

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=due-report.pdf");
        doc.pipe(res);

        doc.fontSize(20).text("Due Payment Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text("Date | Customer | Quantity | Amount");
        doc.moveDown(0.5);

        records.forEach(r => {
            doc.text(
                `${new Date(r.date).toLocaleDateString()} | ${r.user?.name || "-"} | ${r.quantity || 0} | ${r.totalPrice || 0}`
            );
        });

        doc.end();
    } catch (err) {
        console.error("DUE PDF ERROR:", err);
        res.status(500).json({ success: false, message: "Due PDF export failed" });
    }
};
/* =====================================================
   💸 EXPENSE REPORT (JSON)
===================================================== */

export const expenseReport = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};

        // ✅ FILTER USING "date" FIELD (NOT createdAt)
        if (from && to) {
            filter.date = {
                $gte: new Date(from),
                $lte: new Date(to),
            };
        }

        const data = await Expense.find(filter).sort({ date: -1 });

        let totalExpense = 0;
        data.forEach(e => totalExpense += Number(e.amount || 0));

        console.log("EXPENSE FOUND:", data.length);

        res.json({
            success: true,
            totalExpense,
            data,
        });

    } catch (err) {
        console.error("EXPENSE REPORT ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load expense report",
        });
    }
};


/* =====================================================
   💸 EXPENSE CSV
===================================================== */
export const exportExpenseReportCSV = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await Expense.find(filter);

        const data = records.map(e => ({
            Date: new Date(e.date).toLocaleDateString(),
            Type: e.type || "",
            Title: e.title || "",
            Amount: e.amount || 0,
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=expense-report.csv");

        res.send(csv);
    } catch (err) {
        console.error("EXPENSE CSV ERROR:", err);
        res.status(500).json({ success: false, message: "Expense CSV export failed" });
    }
};

/* =====================================================
   💸 EXPENSE PDF
===================================================== */
export const exportExpenseReportPDF = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};
        if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };

        const records = await Expense.find(filter);

        const doc = new PDFDocument({ margin: 30, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=expense-report.pdf");

        doc.pipe(res);

        doc.fontSize(20).text("Expense Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text("Date | Type | Title | Amount");
        doc.moveDown(0.5);

        records.forEach(e => {
            doc.text(
                `${new Date(e.date).toLocaleDateString()} | ${e.type || "-"}| ${e.title || "-"} | ₹${e.amount || 0}`
            );
        });

        doc.end();
    } catch (err) {
        console.error("EXPENSE PDF ERROR:", err);
        res.status(500).json({ success: false, message: "Expense PDF export failed" });
    }
};
