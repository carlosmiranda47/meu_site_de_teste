from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Literal
import sqlite3
from passlib.context import CryptContext

app = FastAPI(title="Gerenciador de Projetos - API")

# Configuração de criptografia para as senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Conexão e criação da tabela no SQLite
def inicializar_banco():
    conn = sqlite3.connect("sistema.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            status_usuario TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

inicializar_banco()

# Modelos de dados para validação (Pydantic)
class UsuarioCadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    # Restringe o status apenas para as 3 opções válidas
    status_usuario: Literal["academico", "praticante", "comum"]

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

# --- ROTAS DA API ---

@app.post("/cadastro", status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: UsuarioCadastro):
    conn = sqlite3.connect("sistema.db")
    cursor = conn.cursor()
    
    # Verifica se o e-mail já existe
    cursor.execute("SELECT id FROM usuarios WHERE email = ?", (usuario.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    # Criptografa a senha antes de salvar
    senha_cripto = pwd_context.hash(usuario.senha)
    
    # Insere no banco
    cursor.execute(
        "INSERT INTO usuarios (nome, email, senha, status_usuario) VALUES (?, ?, ?, ?)",
        (usuario.nome, usuario.email, senha_cripto, usuario.status_usuario)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Usuário cadastrado com sucesso!"}


@app.post("/login")
def login_usuario(usuario: UsuarioLogin):
    conn = sqlite3.connect("sistema.db")
    cursor = conn.cursor()
    
    # Busca o usuário pelo e-mail
    cursor.execute("SELECT id, nome, senha, status_usuario FROM usuarios WHERE email = ?", (usuario.email,))
    resultado = cursor.fetchone()
    conn.close()
    
    if not resultado:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    user_id, nome, senha_cripto, status_usuario = resultado
    
    # Verifica se a senha bate com o hash do banco
    if not pwd_context.verify(usuario.senha, senha_cripto):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    # Retorna os dados essenciais para o Front-End usar
    return {
        "message": "Login bem-sucedido!",
        "usuario": {
            "id": user_id,
            "nome": nome,
            "status": status_usuario
        }
    }
