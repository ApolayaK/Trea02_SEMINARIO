const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// ---------------------- MIDDLEWARE ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// ---------------------- CONFIG DB ----------------------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cotizaciones_productos"
});

// ---------------------- CONFIG MULTER ----------------------
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---------------------- RUTAS ----------------------

// Listar cotizaciones
app.get("/", (req, res) => {
  db.query("SELECT * FROM cotizaciones", (err, results) => {
    if (err) {
      console.error("❌ Error DB:", err);
      return res.status(500).render("error/500", { error: err });
    }
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
  const imagen = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO cotizaciones (cliente, Imagen, precio) VALUES (?, ?, ?)",
    [cliente, imagen, precio],
    (err) => {
      if (err) {
        console.error("❌ Error al insertar:", err);
        return res.status(500).render("error/500", { error: err });
      }
      res.redirect("/");
    }
  );
});

// Editar (mostrar formulario)
app.get("/edit/:id", (req, res) => {
  db.query("SELECT * FROM cotizaciones WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("❌ Error DB:", err);
      return res.status(500).render("error/500", { error: err });
    }

    if (result.length === 0) {
      return res.status(404).render("error/404", { url: req.originalUrl });
    }

    res.render("edit", { cotizacion: result[0] });
  });
});

// Actualizar cotización
app.post("/edit/:id", upload.single("imagen"), (req, res) => {
  const { cliente, precio } = req.body;

  db.query("SELECT * FROM cotizaciones WHERE id=?", [req.params.id], (err, result) => {
    if (err) {
      console.error("❌ Error DB:", err);
      return res.status(500).render("error/500", { error: err });
    }

    if (result.length === 0) {
      return res.status(404).render("error/404", { url: req.originalUrl });
    }

    if (req.file) {
      // Borrar imagen antigua
      const oldImagePath = path.join(__dirname, "public", "uploads", result[0].Imagen);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      db.query(
        "UPDATE cotizaciones SET cliente=?, Imagen=?, precio=? WHERE id=?",
        [cliente, req.file.filename, precio, req.params.id],
        (err) => {
          if (err) {
            console.error("❌ Error al actualizar:", err);
            return res.status(500).render("error/500", { error: err });
          }
          res.redirect("/");
        }
      );
    } else {
      // Sin nueva imagen
      db.query(
        "UPDATE cotizaciones SET cliente=?, precio=? WHERE id=?",
        [cliente, precio, req.params.id],
        (err) => {
          if (err) {
            console.error("❌ Error al actualizar:", err);
            return res.status(500).render("error/500", { error: err });
          }
          res.redirect("/");
        }
      );
    }
  });
});

// Eliminar cotización
app.get("/delete/:id", (req, res) => {
  db.query("SELECT * FROM cotizaciones WHERE id=?", [req.params.id], (err, result) => {
    if (err) {
      console.error("❌ Error DB:", err);
      return res.status(500).render("error/500", { error: err });
    }

    if (result.length === 0) {
      return res.status(404).render("error/404", { url: req.originalUrl });
    }

    const imagePath = path.join(__dirname, "public", "uploads", result[0].Imagen);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    db.query("DELETE FROM cotizaciones WHERE id=?", [req.params.id], (err) => {
      if (err) {
        console.error("❌ Error al eliminar:", err);
        return res.status(500).render("error/500", { error: err });
      }
      res.redirect("/");
    });
  });
});

// ---------------------- MANEJO DE ERRORES ----------------------

// 404: recurso no encontrado
app.use((req, res, next) => {
  res.status(404).render("error/404", { url: req.originalUrl });
});

// 500: error interno
app.use((err, req, res, next) => {
  console.error("❌ Error en el servidor:", err.stack);
  res.status(500).render("error/500", { error: err });
});

// ---------------------- INICIAR SERVIDOR ----------------------
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
