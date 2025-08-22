CREATE DATABASE cotizaciones_productos;
USE cotizaciones_productos;

CREATE TABLE cotizaciones (
	id INT AUTO_INCREMENT PRIMARY KEY,
	cliente VARCHAR(100) NOT NULL,
	Imagen VARCHAR(100) NOT NULL,
	precio DECIMAL(10, 2) NOT NULL
);

INSERT INTO cotizaciones (cliente, Imagen, precio) VALUES
('Cliente A', 'imagen_a.jpg', 100.00),
('Cliente B', 'imagen_b.jpg', 150.50),
('Cliente C', 'imagen_c.jpg', 200.75);

SELECT * FROM cotizaciones;

DROP DATABASE cotizaciones_productos;