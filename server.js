const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");

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

// Rutas

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

// Actualizar
app.post("/edit/:id", upload.single("imagen"), (req, res) => {
  const { cliente, precio } = req.body;
  let query, values;

  if (req.file) {
    query = "UPDATE cotizaciones SET cliente=?, Imagen=?, precio=? WHERE id=?";
    values = [cliente, req.file.filename, precio, req.params.id];
  } else {
    query = "UPDATE cotizaciones SET cliente=?, precio=? WHERE id=?";
    values = [cliente, precio, req.params.id];
  }

  db.query(query, values, (err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

// Eliminar
app.get("/delete/:id", (req, res) => {
  db.query("DELETE FROM cotizaciones WHERE id=?", [req.params.id], (err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
