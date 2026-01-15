import express from 'express';
import dotenv from 'dotenv';
import { ConnectDb } from './db/db.js';
import cors from 'cors';
import compression from "compression";
import admin from './routes/admin.routes.js'
import animal from './routes/animal.routes.js'
import worker from './routes/worker.routes.js'
import auth from "./routes/auth.routes.js";
import user from './routes/user.routes.js'
import milkSell from './routes/milkSell.routes.js'
import report from './routes/report.routes.js'
import expense from './routes/expense.routes.js'
dotenv.config();

const PORT = process.env.PORT || 4000
// console.log("PORT",PORT);

// Db Connection
ConnectDb();

const app = express();
app.use(cors({
    origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Routes
app.use("/api/auth", auth);
app.use('/api/admin', admin)
app.use('/api/animals', animal)
app.use('/api/worker', worker)
app.use('/api/user', user)
app.use('/api/milk-sell', milkSell)
app.use('/api/reports', report)
app.use('/api/expense', expense)

app.listen(PORT, () => {
    console.log(`Example app listening on port http://localhost:${PORT}!`);
});

//Run app, then load  in a browser to see the output.