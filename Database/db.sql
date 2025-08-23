CREATE DATABASE cotizaciones_productos;
USE cotizaciones_productos;

CREATE TABLE cotizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  Imagen VARCHAR(255) DEFAULT NULL
);

-- SELECT * FROM cotizaciones;
-- DROP TABLE cotizaciones;

-- DROP DATABASE cotizaciones_productos;