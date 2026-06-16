CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Aqui guardaremos a senha criptografada
    status_usuario VARCHAR(30) NOT NULL -- 'academico', 'praticante' ou 'comum'
);

CREATE TABLE arquivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome_arquivo TEXT NOT NULL,
    nome_original TEXT NOT NULL,
    titulo TEXT,
    instituicao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);