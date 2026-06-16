const API_URL = "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "image/gif",
    "text/plain",
    "text/html",
    "text/css",
    "application/javascript",
    "application/x-python-code",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function validarArquivo(file) {
    if (!file) return false;
    if (file.size > MAX_FILE_SIZE) {
        alert("O arquivo é muito grande. O limite é 20 MB.");
        return false;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|zip|rar|png|jpe?g|gif|txt|html|css|js|py|doc|docx)$/i)) {
        alert("Tipo de arquivo não permitido. Use PDF, ZIP, imagens, código ou texto.");
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
	const infoUsuario = localStorage.getItem("usuario_logado");
	
	if (!infoUsuario) {
	    alert("Acesso negado. por favor, faça login primeiro.");
	    window.location.href = "index.html";
	    return;
	}
	
	const usuario = JSON.parse(infoUsuario);
	
	document.getElementById("user-nome").innerText = usuario.nome;
	document.getElementById("welcome-nome").innerText = usuario.nome.split(" ")[0] || usuario.nome;
	document.getElementById("user-status").innerText = usuario.status;
	
	const menuEspecifico = document.getElementById("menu-especifico");
	const containerUpload = document.getElementById("container-upload-dinamico");
	const campoAcademicos = document.getElementById("campos-academicos");
	const campoArquivo = document.getElementById("campo-arquivo");
	
	if (usuario.status === "academico") {
		menuEspecifico.innerText = "🎓 Meus Artigos e TCCs";
		containerUpload.querySelector(".search-title").innerText = "🎓 Publicar Artigo Científico / TCC";
        campoAcademicos.classList.remove("escondido");
        campoArquivo.required = true;
        
    } else if (usuario.status === "praticante") {
        menuEspecifico.innerText = "💼 Meus Projetos de Mercado";
        containerUpload.querySelector(".search-title").innerText = "💼 Compartilhar Projeto Prático / Case";
        campoAcademicos.classList.add("escondido");
        campoArquivo.required = true;
    } else {
        menuEspecifico.innerText = "📁 Meus Arquivos Salvos";
        containerUpload.style.display = "none";
    }

    carregarArquivosUsuario(usuario.id);
});

document.getElementById('campo-arquivo').addEventListener('change', function() {
    const label = document.getElementById('nome-arquivo-selecionado');
    if (this.files.length > 0) {
        label.innerText = `📄 Arquivo pronto: ${this.files[0].name}`;
    } else {
        label.innerText = "Nenhum arquivo selecionado";
    }
});


document.getElementById("form-upload").addEventListener("submit", async (e) => {
    e.preventDefault();

    const campoArquivo = document.getElementById("campo-arquivo");
    if (campoArquivo.files.length === 0) {
        alert("Por favor, selecione um arquivo primeiro.");
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario_logado"));
    const arquivoSelecionado = campoArquivo.files[0];
    if (!validarArquivo(arquivoSelecionado)) {
        return;
    }
    const formData = new FormData();
    formData.append("usuario_id", usuario.id);
    formData.append("arquivo", arquivoSelecionado);

    if (usuario.status === "academico") {
        const tituloTcc = document.getElementById("upload-titulo-tcc").value;
        const instituicao = document.getElementById("upload-instituicao").value;
        formData.append("titulo_tcc", tituloTcc);
        formData.append("instituicao", instituicao);
    }

    try {
        const resposta = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert("Sucesso! " + dados.message);
            document.getElementById("form-upload").reset();
            document.getElementById('nome-arquivo-selecionado').innerText = "Nenhum arquivo selecionado";
            carregarArquivosUsuario(usuario.id);
        } else {
            alert("Erro no upload: " + (dados.detail ?? "Erro desconhecido."));
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

async function carregarArquivosUsuario(usuarioId) {
    try {
        const resposta = await fetch(`${API_URL}/meus-arquivos/${usuarioId}`);
        const dados = await resposta.json();
        const container = document.getElementById("meus-arquivos-container");
        container.innerHTML = "";

        if (!resposta.ok) {
            container.innerHTML = `<p>Não foi possível carregar seus arquivos.</p>`;
            return;
        }

        if (!dados.arquivos || dados.arquivos.length === 0) {
            container.innerHTML = `<div class="sem-arquivos">Nenhum arquivo enviado ainda.</div>`;
            return;
        }

        dados.arquivos.forEach((arquivo) => {
            const card = document.createElement("div");
            card.className = "card-trabalho";
            card.innerHTML = `
                <h3>${arquivo.nome_original}</h3>
                <p>${arquivo.titulo ? arquivo.titulo : "Sem título adicional"}</p>
                <div class="card-footer">
                    <div class="card-actions">
                        <a href="${arquivo.url}" target="_blank">Abrir arquivo</a>
                        <a href="${arquivo.url}" download="${arquivo.nome_original}" class="btn-download">Baixar</a>
                    </div>
                    <span>${arquivo.instituicao ? arquivo.instituicao : "Sem instituição"}</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (erro) {
        console.error(erro);
        document.getElementById("meus-arquivos-container").innerHTML = `<p>Erro ao carregar arquivos.</p>`;
    }
};

function buscarTrabalhos() {
    const termo = document.getElementById("busca-input").value;
    const filtro = document.getElementById("filtro-tipo").value;
    alert(`Buscando por "${termo}" filtrando por [${filtro}]...`);
}

function fazerLogout() {
    localStorage.removeItem("usuario_logado");
    window.location.href = "index.html";
}