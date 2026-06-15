CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Aqui guardaremos a senha criptografada
    status_usuario VARCHAR(30) NOT NULL -- 'academico', 'praticante' ou 'comum'
);
