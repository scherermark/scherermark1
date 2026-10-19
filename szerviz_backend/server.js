require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

app.get("/jarmuvek", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT jarmuvek.*, tulajdonosok.nev AS tulajdonos_nev
            FROM jarmuvek
            JOIN tulajdonosok
            ON jarmuvek.tulajdonos_id = tulajdonosok.id
            ORDER BY jarmuvek.javitasi_koltseg ASC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/jarmuvek/kesz", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM jarmuvek
            WHERE kesz_van = 1 AND javitasi_koltseg <= 80000
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/jarmuvek/kereses/:szoveg", async (req, res) => {
    try {
        const szoveg = req.params.szoveg;

        const [rows] = await db.query(`
            SELECT id, modell FROM jarmuvek
            WHERE modell LIKE ?
        `, [`%${szoveg}%`]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/tulajdonosok/statisztika", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT tulajdonosok.nev AS tulajdonos_nev,
            COUNT(jarmuvek.id) AS jarmuvek_szama,
            ROUND(AVG(jarmuvek.javitasi_koltseg), 0) AS atlagos_koltseg
            FROM tulajdonosok
            JOIN jarmuvek
            ON tulajdonosok.id = jarmuvek.tulajdonos_id
            GROUP BY tulajdonosok.id, tulajdonosok.nev
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/jarmuvek/dragak", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT rendszam, modell, javitasi_koltseg
            FROM jarmuvek
            WHERE javitasi_koltseg > 100000
            ORDER BY javitasi_koltseg DESC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ hiba: "A végpont nem található" });
});

app.listen(process.env.PORT, () => {
    console.log(`Szerver fut: http://localhost:${process.env.PORT}`);
});