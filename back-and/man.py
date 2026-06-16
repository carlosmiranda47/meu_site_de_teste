from typing import Optional
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import sqlite3
import hashlib
import os
import time

app = FastAPI(title="Gerenciador de Projetos - API")

UPLOAD_DIR = "ARQUIVO_ENVIADO"
UPLOAD_BASE_URL = "http://127.0.0.1:8000"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
    

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def criptografar_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

def verificar_senha(senha_pura, senha_criptografada):
    return criptografar_senha(senha_pura) == senha_criptografada

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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS arquivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            nome_arquivo TEXT,
            nome_original TEXT,
            titulo TEXT,
            instituicao TEXT,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    """)
    conn.commit()

    cursor.execute("PRAGMA table_info(arquivos)")
    columns = [row[1] for row in cursor.fetchall()]
    if "nome_original" not in columns:
        cursor.execute("ALTER TABLE arquivos ADD COLUMN nome_original TEXT")
        conn.commit()

    conn.close()

inicializar_banco()

class UsuarioCadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    status_usuario: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str



@app.post("/cadastro", status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: UsuarioCadastro):
    try:
        conn = sqlite3.connect("sistema.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM usuarios WHERE email = ?", (usuario.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        
        senha_cripto = criptografar_senha(usuario.senha)
        
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha, status_usuario) VALUES (?, ?, ?, ?)",
            (usuario.nome, usuario.email, senha_cripto, usuario.status_usuario)
        )
        conn.commit()
        
        user_id = cursor.lastrowid
        conn.close()
        
        return {
            "message": "Usuário cadastrado com sucesso!",
            "usuario": {
                "id": user_id,
                "nome": usuario.nome,
                "status": usuario.status_usuario
            }
        }
    except Exception as e:
        print(f"ERRO NO CADASTRO: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/login")
def login_usuario(usuario: UsuarioLogin):
    conn = sqlite3.connect("sistema.db")
    cursor = conn.cursor()

    cursor.execute("SELECT id, nome, senha, status_usuario FROM usuarios WHERE email = ? ", (usuario.email,))
    user = cursor.fetchone()
    conn.close()

    if not user  or not verificar_senha(usuario.senha, user[2]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretas.")
    
    return {
        "usuario": {
            "id": user [0],
            "nome": user [1],
            "status": user [3]
        }
    }

@app.post("/upload")
async def upload_arquivo(
    usuario_id: int, # Adicione este campo no seu FormData no JS
    arquivo: UploadFile = File(...),
    titulo_tcc: Optional[str] = None,
    instituicao: Optional[str] = None
):
    try:
        nome_original = os.path.basename(arquivo.filename)
        arquivo_salvo = f"{usuario_id}_{int(time.time())}_{nome_original}"
        caminho_arquivo = os.path.join(UPLOAD_DIR, arquivo_salvo)

        with open(caminho_arquivo, "wb") as f:
            f.write(await arquivo.read())

        conn = sqlite3.connect("sistema.db")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO arquivos (usuario_id, nome_arquivo, nome_original, titulo, instituicao) VALUES (?, ?, ?, ?, ?)",
            (usuario_id, arquivo_salvo, nome_original, titulo_tcc, instituicao)
        )
        conn.commit()
        conn.close()

        return {
            "message": "Arquivo salvo e registrado com sucesso!",
            "url": f"{UPLOAD_BASE_URL}/uploads/{arquivo_salvo}",
            "nome_original": nome_original
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/meus-arquivos/{usuario_id}")
def listar_arquivos(usuario_id: int):
    conn = sqlite3.connect("sistema.db")
    cursor = conn.cursor()
    # Buscamos os dados formatados
    cursor.execute(
        "SELECT id, nome_arquivo, nome_original, titulo, instituicao FROM arquivos WHERE usuario_id = ?",
        (usuario_id,)
    )
    arquivos = [
        {
            "id": row[0],
            "url": f"{UPLOAD_BASE_URL}/uploads/{row[1]}",
            "nome_original": row[2] if row[2] else row[1],
            "titulo": row[3],
            "instituicao": row[4]
        }
        for row in cursor.fetchall()
    ]
    
    conn.close()
    return {"arquivos": arquivos}