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

// Carpeta de uploads
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Config DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cotizaciones_productos",
});

// Config Multer (subida de imágenes)
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------------- RUTAS ----------------------

// Listar
app.get("/", (req, res, next) => {
  db.query("SELECT * FROM cotizaciones", (err, results) => {
    if (err) return next(err);
    res.render("index", {
      cotizaciones: results,
      deleted: req.query.deleted,
      error: req.query.error,
    });
  });
});

// Formulario nuevo
app.get("/new", (req, res) => {
  res.render("new");
});

// Guardar nuevo
app.post("/new", upload.single("imagen"), (req, res, next) => {
  const { cliente, precio } = req.body;

  // Validaciones 
  const precioNum = Number.parseFloat(precio);
  if (!cliente || Number.isNaN(precioNum)) {
    return res.redirect("/?error=1");
  }

  
  const imagen = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO cotizaciones (cliente, Imagen, precio) VALUES (?, ?, ?)",
    [cliente, imagen, precioNum],
    (err) => {
      if (err) return next(err);
      res.redirect("/");
    }
  );
});

// Editar 
app.get("/edit/:id", (req, res, next) => {
  db.query(
    "SELECT * FROM cotizaciones WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(404).render("404", { url: req.originalUrl });
      }
      res.render("edit", { cotizacion: results[0] });
    }
  );
});

// Actualizar (con o sin nueva imagen)
app.post("/edit/:id", upload.single("imagen"), (req, res, next) => {
  const { cliente, precio } = req.body;
  const precioNum = Number.parseFloat(precio);
  if (!cliente || Number.isNaN(precioNum)) {
    return res.redirect("/?error=1");
  }

  // Verificacion de que exista la cotización
  db.query(
    "SELECT Imagen FROM cotizaciones WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        return res.status(404).render("404", { url: req.originalUrl });
      }

      const oldImage = result[0].Imagen;

      // Si hay nueva imagen, borrar la anterior (si existía)
      if (req.file) {
        if (oldImage) {
          const oldImagePath = path.join(uploadsDir, oldImage);
          try {
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
          } catch (e) {
            console.warn("⚠️ No se pudo borrar la imagen anterior:", e.message);
          }
        }

        // Actualizar con nueva imagen
        db.query(
          "UPDATE cotizaciones SET cliente = ?, Imagen = ?, precio = ? WHERE id = ?",
          [cliente, req.file.filename, precioNum, req.params.id],
          (err2) => {
            if (err2) return next(err2);
            res.redirect("/");
          }
        );
      } else {
        // Actualizar img
        db.query(
          "UPDATE cotizaciones SET cliente = ?, precio = ? WHERE id = ?",
          [cliente, precioNum, req.params.id],
          (err2) => {
            if (err2) return next(err2);
            res.redirect("/");
          }
        );
      }
    }
  );
});

// Eliminar (con eliminación de la imagen)
app.post("/delete/:id", (req, res, next) => {
  db.query(
    "SELECT Imagen FROM cotizaciones WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return next(err);

      if (results.length === 0) {
        return res.status(404).render("404", { url: req.originalUrl });
      }

      const imagen = results[0].Imagen;

      // Eliminar imagen del disco si existe
      if (imagen) {
        const imagePath = path.join(uploadsDir, imagen);
        try {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (e) {
          console.warn("⚠️ No se pudo borrar la imagen:", e.message);
        }
      }

      // Borrar registro
      db.query(
        "DELETE FROM cotizaciones WHERE id = ?",
        [req.params.id],
        (err2) => {
          if (err2) return next(err2);
          res.redirect("/?deleted=1");
        }
      );
    }
  );
});

// ---------------------- ERRORES ----------------------

// 404 - Página no encontrada
app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// 500 - Error interno del servidor
app.use((err, req, res, next) => {
  console.error("❌ Error en el servidor:", err.stack || err);
  res.status(500).render("500");
});

// ---------------------- INICIAR SERVIDOR ----------------------
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
