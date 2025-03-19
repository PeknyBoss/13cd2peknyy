const express = require("express");
const mysql = require("mysql");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
 
app.use(cors());
app.use(bodyParser.json());
 
// Adatbázis kapcsolat
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  port: "3307", // Ellenőrizd, hogy nálad is ezen a porton fut-e a MySQL
  password: "", // Ha van jelszavad, itt add meg
  database: "atletikavb2017",
});
 
// Kapcsolat ellenőrzése
db.connect((err) => {
  if (err) {
    console.error("Hiba az adatbázis kapcsolódásakor:", err);
    return;
  }
  console.log("Sikeresen kapcsolódva az adatbázishoz!");
});
 
// Alapértelmezett útvonal
app.get("/", (req, res) => {
  res.send("A szerver működik!");
});
 
// 1. lekérdezés: Versenyszámok neve, ahol az időtartam több mint 60 perc - GET
app.get("/api/hosszuevents", (req, res) => {
  // Az időtartamot az 'Eredmeny' oszlopból vesszük, átalakítjuk percekre
  // Feltételezzük, hogy az 'Eredmeny' formátuma: "óra:perc:másodperc" vagy "perc:másodperc"
  const query = `
    SELECT DISTINCT Versenyszam
    FROM versenyekszamok
    WHERE
      CASE
        WHEN Eredmeny LIKE '%:%:%' THEN
          (SUBSTRING_INDEX(Eredmeny, ':', 1) * 60) + SUBSTRING_INDEX(SUBSTRING_INDEX(Eredmeny, ':', 2), ':', -1) > 60
        WHEN Eredmeny LIKE '%:%' THEN
          SUBSTRING_INDEX(Eredmeny, ':', 1) > 60
        ELSE 0
      END
  `;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Adatbázis hiba: " + err.message });
    }
    res.json(results);
  });
});
 
// 2. lekérdezés: Új versenyző hozzáadása - POST
app.post("/api/versenyzok", (req, res) => {
  const { Versenyszam, Nem, NemzetKod, VersenyzoNev, Eredmeny, Csucs, Helyezes } = req.body;
  const query = `
    INSERT INTO versenyekszamok (Versenyszam, Nem, NemzetKod, VersenyzoNev, Eredmeny, Csucs, Helyezes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [Versenyszam, Nem, NemzetKod, VersenyzoNev, Eredmeny, Csucs, Helyezes],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Hiba a versenyző hozzáadása közben: " + err.message });
      }
      res.status(201).json({ message: "Versenyző sikeresen hozzáadva", id: result.insertId });
    }
  );
});
 
// Szerver indítása
app.listen(3000, () => {
  console.log("A szerver a 3000 porton fut!");
});