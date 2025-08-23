const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Config DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cotizaciones_productos"
});

// Config Multer (subida de imágenes)
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---------------------- RUTAS ----------------------

// Listar
app.get("/", (req, res) => {
  db.query("SELECT * FROM cotizaciones", (err, results) => {
    if (err) throw err;
    res.render("index", { cotizaciones: results });
  });
});

// Formulario nuevo
app.get("/new", (req, res) => {
  res.render("new");
});

// Guardar nuevo
app.post("/new", upload.single("imagen"), (req, res) => {
  const { cliente, precio } = req.body;
  const imagen = req.file.filename;

  db.query(
    "INSERT INTO cotizaciones (cliente, Imagen, precio) VALUES (?, ?, ?)",
    [cliente, imagen, precio],
    (err) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

// Editar
app.get("/edit/:id", (req, res) => {
  db.query("SELECT * FROM cotizaciones WHERE id = ?", [req.params.id], (err, result) => {
    if (err) throw err;
    res.render("edit", { cotizacion: result[0] });
  });
});

// Actualizar la imagen
app.post("/edit/:id", upload.single("imagen"), (req, res) => {
  const { cliente, precio } = req.body;

  if (req.file) {
    // Buscar la imagen antigua
    db.query("SELECT Imagen FROM cotizaciones WHERE id=?", [req.params.id], (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        const oldImagePath = path.join(__dirname, "public", "uploads", result[0].Imagen);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // elimina la anterior
        }
      }

      // Guardar la nueva en DB
      db.query(
        "UPDATE cotizaciones SET cliente=?, Imagen=?, precio=? WHERE id=?",
        [cliente, req.file.filename, precio, req.params.id],
        (err) => {
          if (err) throw err;
          res.redirect("/");
        }
      );
    });
  } else {
    // Si no hay nueva imagen, solo actualizar texto y precio
    db.query(
      "UPDATE cotizaciones SET cliente=?, precio=? WHERE id=?",
      [cliente, precio, req.params.id],
      (err) => {
        if (err) throw err;
        res.redirect("/");
      }
    );
  }
});

// Eliminar (con eliminación de la imagen)
app.get("/delete/:id", (req, res) => {
  db.query("SELECT Imagen FROM cotizaciones WHERE id=?", [req.params.id], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const imagePath = path.join(__dirname, "public", "uploads", result[0].Imagen);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // elimina la imagen del disco
      }
    }

    db.query("DELETE FROM cotizaciones WHERE id=?", [req.params.id], (err) => {
      if (err) throw err;
      res.redirect("/");
    });
  });
});

// ---------------------- INICIAR SERVIDOR ----------------------
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
