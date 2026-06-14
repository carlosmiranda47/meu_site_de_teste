from typing import Optional
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import sqlite3
import hashlib
import os

app = FastAPI(title="Gerenciador de Projetos - API")

UPLOAD_DIR = "ARQUIVO_ENVIADO"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    

# Configuração do CORS (Libera o acesso para o index.html)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Funções de criptografia usando hashlib (Substitutos do Bcrypt)
def criptografar_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

def verificar_senha(senha_pura, senha_criptografada):
    return criptografar_senha(senha_pura) == senha_criptografada

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
    status_usuario: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

# --- ROTAS DA API ---

@app.post("/cadastro", status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: UsuarioCadastro):
    try:
        conn = sqlite3.connect("sistema.db")
        cursor = conn.cursor()
        
        # Verifica se o e-mail já existe
        cursor.execute("SELECT id FROM usuarios WHERE email = ?", (usuario.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        
        # USA A NOVA CRIPTOGRAFIA DO HASHLIB
        senha_cripto = criptografar_senha(usuario.senha)
        
        # Insere no banco
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha, status_usuario) VALUES (?, ?, ?, ?)",
            (usuario.nome, usuario.email, senha_cripto, usuario.status_usuario)
        )
        conn.commit()
        
        # BUSCA O ID QUE ACABOU DE SER GERADO PARA ENVIAR AO FRONT-END
        user_id = cursor.lastrowid
        conn.close()
        
        # RETORNO ATUALIZADO: envia a mensagem e os dados do usuário juntos!
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
async def upload_arquivo(arquivo: UploadFile = File(...)):
	try:
		
		caminho_arquivo = os.path.join(UPLOAD_DIR, arquivo.filename)
		
		with open(caminho_arquivo, "wb") as f:
			conteudo = await arquivo.read()
			f.write(conteudo) 
			
			
			return {"mensage": f"Arquivo '{arquivo.filename}' enviado com sucesso!"}
			
	except Exception as e:
		print(f"ERRO NO UPLOAD: {e}")
		raise HTTPException(status_code=500, detail=f"Erro ao salvar o arquivo: {str(e)} ")