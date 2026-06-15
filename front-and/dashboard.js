document.addEventListener("DOMContentLoaded", () => {
	const infoUsuario = localStorage.getItem("usuario_logado");
	
	if (!infoUsuario) {
	    alert("Acesso negado. por favor, faça login primeiro.");
	    window.location.href = "index.html";
	    return;
	}
	
	const usuario = JSON.parse(infoUsuario);
	
	document.getElementById("user-nome").innerText = usuario.nome;
	document.getElementById("welcome-nome").innerText = usuario.nome.split("")[0];
	document.getElementById("user-status").innerText = usuario.status;
	
	const menuEspecifico = document.getElementById("menu-especifico");
	const containerUpload = document.getElementById("container-upload-dinamico");
	const campoAcademicos = document.getElementById("campos-academicos");
	const tituloUpload = document.getElementById("titulo-upload-perfil");
	const textoAjuda = document.getElementById("texto-ajuda-upload");
	const campoArquivo = document.getElementById("campo-arquivo");
	
	if (usuario.status == "academico") {
		menuEspecifico.innerText = "🎓 Meus Artigos e TCCs";
		tituloUpload.innerText = "🎓 Publicar Artigo Científico / TCC";
        textoAjuda.innerText = "Selecione o arquivo PDF do seu artigo científico";
        camposAcademicos.style.display = "block";
        campoArquivo.required = true;
        
    } else if (usuario.status === "praticante") {
        menuEspecifico.innerText = "💼 Meus Projetos de Mercado";
        tituloUpload.innerText = "💼 Compartilhar Projeto Prático / Case";
        textoAjuda.innerText = "Clique para selecionar imagens, códigos ou ZIP do projeto";
        camposAcademicos.style.display = "none";
        campoArquivo.required = true;
        
    } else {
        menuEspecifico.innerText = "📁 Meus Arquivos Salvos";
        containerUpload.style.display = "none"; 
    }
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

    const formData = new FormData();
    formData.append("arquivo", campoArquivo.files[0]);

    const infoUsuario = JSON.parse(localStorage.getItem("usuario_logado"));
    if (infoUsuario.status === "academico") {
        const tituloTcc = document.getElementById("upload-titulo-tcc").value;
        const instituicao = document.getElementById("upload-instituicao").value;
        
        formData.append("titulo_tcc", tituloTcc);
        formData.append("instituicao", instituicao);
    }

    try {
        const resposta = await fetch("http://127.0.0.1:8000/upload", {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert("Sucesso! " + dados.message);
            document.getElementById("form-upload").reset();
            document.getElementById('nome-arquivo-selecionado').innerText = "Nenhum arquivo selecionado";
        } else {
            alert("Erro no upload: " + dados.detail);
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

function buscarTrabalhos() {
    const termo = document.getElementById("busca-input").value;
    const filtro = document.getElementById("filtro-tipo").value;
    alert(`Buscando por "${termo}" filtrando por [${filtro}]...`);
}

function fazerLogout() {
    localStorage.removeItem("usuario_logado");
    window.location.href = "index.html";
	
