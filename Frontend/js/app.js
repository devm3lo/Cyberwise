// No arquivo: frontend/js/app.js

// --- CONSTANTES GLOBAIS ---
const API_URL = 'http://127.0.0.1:8000/api';
const BASE_URL = 'http://127.0.0.1:8000'; // Necessário para montar o link da imagem
const AUTH_TOKEN = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configura o Menu (Login/Logout)
    updateHeaderUI();

    // 2. Menu Mobile
    const hamburger = document.querySelector('.menu-hamburger');
    const navMenu = document.querySelector('.main-nav');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // 3. Roteamento Simples (Executa função baseada na página)
    const path = window.location.pathname;

    if (path.endsWith('participar.html') || path.endsWith('/') || path.endsWith('index.html')) {
        // Se houver um grid de campanhas, carrega-as
        const campaignGrid = document.querySelector('.campaign-grid');
        if (campaignGrid) fetchCampanhas(campaignGrid);
        
    } else if (path.endsWith('campanha-detalhe.html')) {
        fetchCampanhaDetalhe();
        
    } else if (path.endsWith('doar.html')) {
        setupDonationForm();
        
    } else if (path.endsWith('register.html')) {
        setupRegistrationForm();
        
    } else if (path.endsWith('login.html')) {
        setupLoginForm();
        
    } else if (path.endsWith('pedir-ajuda.html')) {
        setupHelpForm();
        
    } else if (path.endsWith('acoes.html')) {
        fetchInstituicoes();

    } else if (path.endsWith('perfil.html')) {
        fetchUserProfile();

    } else if (path.endsWith('checklist.html')) {
        setupInteractiveChecklist();
        
    } else if (path.endsWith('instituicao-detalhe.html')) {
        fetchInstituicaoDetalhe();
    } 
    
    // 4. Animações Fade-in (Genérico)
    setupFadeInAnimations();
});

// --- FUNÇÕES AUXILIARES ---

function updateHeaderUI() {
    const navUl = document.querySelector('.main-nav ul');
    if (!navUl) return;

    if (AUTH_TOKEN) {
        // LOGADO
        navUl.innerHTML = `
            <li><a href="index.html">HOME</a></li>
            <li><a href="participar.html">CAMPANHAS</a></li>
            <li><a href="perfil.html">MEU PERFIL</a></li> 
            <li><a href="checklist.html">CHECKLIST</a></li>
            <li><a href="acoes.html">AÇÕES</a></li>
            <li><a href="pedir-ajuda.html">PEDIR AJUDA</a></li> 
            <li><a href="doar.html" class="btn-primary">Faça uma Doação</a></li>
            <li><a href="#" id="logout-button">LOGOUT</a></li> 
        `;
        document.getElementById('logout-button').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    } else {
        // DESLOGADO
        navUl.innerHTML = `
            <li><a href="index.html">HOME</a></li>
            <li><a href="participar.html">CAMPANHAS</a></li>
            <li><a href="checklist.html">CHECKLIST</a></li>
            <li><a href="acoes.html">AÇÕES</a></li>
            <li><a href="login.html">LOGIN</a></li>
            <li><a href="doar.html" class="btn-primary">Faça uma Doação</a></li>
        `;
    }
}

function setupFadeInAnimations() {
    const elements = document.querySelectorAll('.section-title, .impact-card, .testimonial-card, .how-to-card, .campaign-card, .event-card, .donation-card, .support-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Anima só uma vez
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// --- FUNÇÕES DE PÁGINA ---

async function fetchCampanhas(gridElement) {
    try {
        const response = await fetch(`${API_URL}/campanhas/`);
        if (!response.ok) throw new Error('Erro ao buscar campanhas');
        const campanhas = await response.json();
        
        gridElement.innerHTML = ''; 
        
        campanhas.forEach(campanha => {
            // CORREÇÃO IMAGEM: Verifica se existe imagem e monta URL completo
            let imgUrl = 'images/campanha-placeholder.jpg'; // Default
            if (campanha.imagem_capa) {
                // Se a API já mandar http, usa; senão concatena BASE_URL
                if (campanha.imagem_capa.startsWith('http')) {
                    imgUrl = campanha.imagem_capa;
                } else {
                    imgUrl = `${BASE_URL}${campanha.imagem_capa}`;
                }
            }

            const cardHTML = `
            <a href="campanha-detalhe.html?id=${campanha.id}" class="campaign-card-link">
                <div class="campaign-card">
                    <div class="campaign-image">
                        <img src="${imgUrl}" alt="${campanha.titulo}" onerror="this.src='images/campanha-placeholder.jpg'">
                    </div>
                    <div class="campaign-content">
                        <h3>${campanha.titulo}</h3>
                        <p class="campaign-description">${campanha.descricao.substring(0, 100)}...</p> 
                        <span class="participant-count">${campanha.participantes_count} participantes</span>
                    </div>
                </div>
            </a>`;
            gridElement.insertAdjacentHTML('beforeend', cardHTML);
        });
    } catch (error) {
        console.error(error);
        gridElement.innerHTML = '<p>Não foi possível carregar as campanhas.</p>';
    }
}

// No arquivo: frontend/js/app.js

async function fetchCampanhaDetalhe() {
    try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) throw new Error('ID não encontrado');
        
        const headers = { 'Content-Type': 'application/json' };
        let user = null;

        // 1. Buscar Usuário Logado
        if (AUTH_TOKEN) {
            headers['Authorization'] = `Token ${AUTH_TOKEN}`;
            try {
                const uRes = await fetch(`${API_URL}/auth/user/`, { headers });
                if (uRes.ok) {
                    user = await uRes.json();
                    // Garante que temos o ID correto
                    user.id = user.pk || user.id;
                }
            } catch(e) { console.error(e); }
        }
        
        // 2. Buscar Campanha
        const response = await fetch(`${API_URL}/campanhas/${id}/`, { headers });
        if (!response.ok) throw new Error('Campanha não encontrada');
        const campanha = await response.json();

        // Preencher HTML
        document.title = campanha.titulo;
        document.getElementById('detail-title').innerText = campanha.titulo;
        document.getElementById('detail-description').innerText = campanha.descricao;
        document.getElementById('detail-status').innerText = campanha.status;
        
        // Preencher Listas (Função auxiliar)
        renderList('event-list', campanha.eventos, i => `<div class="event-card"><h4>${i.titulo}</h4><p>${i.descricao}</p></div>`, 'Sem eventos.');
        renderList('donation-list', campanha.doacoes, i => `<div class="donation-card"><h4>R$ ${i.valor}</h4><p>${i.usuario_username || 'Anônimo'}</p></div>`, 'Sem doações.');
        renderList('support-list', campanha.apoios, i => `<div class="support-card"><h4>${i.nome_instituicao}</h4><p>${i.tipo_apoio}</p></div>`, 'Sem apoio.');

        // 3. Lógica do Botão Participar
        const wrapper = document.getElementById('participate-wrapper');
        
        if (user) {
            // Verifica se o usuário JÁ participa
            let isParticipating = campanha.participantes.includes(user.id);

            // Função para desenhar o botão
            const renderBtn = () => {
                const btnText = isParticipating ? 'Sair da Campanha' : 'Participar desta Campanha';
                const btnClass = isParticipating ? 'btn-secondary participate-btn' : 'btn-primary';
                
                wrapper.innerHTML = `<button id="p-btn" class="${btnClass}">${btnText}</button>`;
                
                // Adiciona o evento de clique ao NOVO botão
                document.getElementById('p-btn').onclick = handleClick;
            };

            // Função do clique
            const handleClick = async (e) => {
                e.preventDefault();
                const btn = e.target;
                btn.disabled = true;
                btn.innerText = 'Processando...';

                try {
                    // Faz o pedido ao backend
                    const postResp = await fetch(`${API_URL}/campanhas/${id}/participar/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Token ${AUTH_TOKEN}` } // Sem Content-Type
                    });

                    if (!postResp.ok) {
                        const err = await postResp.json();
                        throw new Error(err.detail || 'Erro ao participar');
                    }

                    // Sucesso: Inverte o estado e redesenha o botão
                    isParticipating = !isParticipating;
                    renderBtn();

                } catch (err) {
                    console.error(err);
                    wrapper.insertAdjacentHTML('beforeend', `<p style="color:red">${err.message}</p>`);
                    renderBtn(); // Restaura o botão em caso de erro
                }
            };

            renderBtn(); // Desenha o botão inicial

        } else {
            wrapper.innerHTML = `<p>Faça <a href="login.html">login</a> para participar.</p>`;
        }

    } catch (error) {
        console.error(error);
        document.querySelector('.detail-content').innerHTML = '<h2>Erro ao carregar campanha.</h2>';
    }
}

// Função auxiliar que faltava no seu código anterior
function renderList(id, data, template, emptyMsg) {
    const el = document.getElementById(id);
    if(!el) return;
    if(data && data.length > 0) {
        el.innerHTML = data.map(template).join('');
    } else {
        el.innerHTML = `<p>${emptyMsg}</p>`;
    }
}

// Helper simples para renderizar listas
function renderList(elementId, dataArray, templateFn, emptyMsg) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (dataArray && dataArray.length > 0) {
        el.innerHTML = dataArray.map(templateFn).join('');
    } else {
        el.innerHTML = `<p>${emptyMsg}</p>`;
    }
}

// --- FORMS ---

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const msgEl = document.getElementById('form-message');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { email: form.email.value, password: form.password.value };
        
        try {
            const res = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if(!res.ok) {
                // Mostra o erro real do backend (ex: senha errada)
                throw new Error(json.non_field_errors || json.detail || 'Erro ao fazer login.');
            }

            localStorage.setItem('authToken', json.key);
            msgEl.className = 'success';
            msgEl.innerText = 'Login sucesso! Redirecionando...';
            msgEl.style.display = 'block';
            window.location.href = 'index.html'; // Redireciona para a home
            setTimeout(() => { window.location.replace('index.html'); }, 1000);

        } catch (err) {
            msgEl.className = 'error';
            msgEl.innerText = err.message;
            msgEl.style.display = 'block';
        }
    });
}

function setupRegistrationForm() {
    const form = document.getElementById('register-form');
    const msgEl = document.getElementById('form-message');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: form.username.value,
            email: form.email.value,
            password1: form.password.value,
            password2: form.password2.value,
            tipo: form.tipo.value
        };

        try {
            const res = await fetch(`${API_URL}/auth/registration/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!res.ok) {
                // Tratamento de erro detalhado
                let msg = "Erro no registro: ";
                if (json.email) msg += "Email inválido ou já em uso. ";
                if (json.password) msg += "Senha fraca. ";
                if (json.username) msg += "Nome de usuário já existe. ";
                // Se não for nenhum desses, mostra o JSON cru para debug
                if (!json.email && !json.password && !json.username) msg += JSON.stringify(json);
                
                throw new Error(msg);
            }

            alert('Conta criada! Faça login.');
            window.location.href = 'login.html';

        } catch (err) {
            alert(err.message);
            alert('Erro ao criar conta. Verifique os dados.');
        }
    });
}

// (setupDonationForm, setupHelpForm, fetchInstituicoes, setupInteractiveChecklist, fetchInstituicaoDetalhe mantêm-se iguais às versões anteriores que funcionavam)
// Para garantir que não falte nada, adicionei stubs funcionais abaixo. Se já tiver o código delas, mantenha.
async function setupDonationForm() {
    const form = document.getElementById('donation-form');
    if (!form) return; // Se não estiver na página de doação, sai

    const selectCampanha = document.getElementById('campanha');
    const selectTipo = document.getElementById('tipo');
    const valorGroup = document.getElementById('valor-group');
    const msgEl = document.getElementById('form-message');
    
    // Elementos de input direto (para evitar o bug do FormData)
    const inputValor = document.getElementById('valor');
    const inputDescricao = document.getElementById('descricao');

    // 1. Preenche a lista de campanhas ativas
    try {
        const response = await fetch(`${API_URL}/campanhas/?status=ativa`);
        const campanhas = await response.json();
        
        campanhas.forEach(campanha => {
            const option = new Option(campanha.titulo, campanha.id);
            selectCampanha.add(option);
        });

        // POLIMENTO EXTRA: Verifica se viemos de um link "Doar para esta campanha"
        // Ex: doar.html?campanha=5
        const params = new URLSearchParams(window.location.search);
        const preSelectedId = params.get('campanha');
        if (preSelectedId) {
            selectCampanha.value = preSelectedId;
        }

    } catch (error) {
        console.error('Falha ao buscar campanhas para o form:', error);
    }

    // 2. Lógica visual: Esconde o valor se for doação material
    selectTipo.addEventListener('change', () => {
        if (selectTipo.value === 'financeira') {
            valorGroup.style.display = 'block';
            inputValor.required = true;
        } else {
            valorGroup.style.display = 'none';
            inputValor.required = false;
            inputValor.value = ''; // Limpa o valor
        }
    });

    // 3. Envio do Formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Lógica para limpar os dados antes de enviar
        let campanhaId = selectCampanha.value;
        // Se o valor for vazio (Doação Geral), envia null para o backend
        if (campanhaId === "") { 
            campanhaId = null; 
        }

        let valorDoacao = inputValor.value;
        // Se for material, o valor monetário é nulo
        if (selectTipo.value === 'material' || valorDoacao === "") { 
            valorDoacao = null; 
        }

        // Monta o objeto JSON manualmente (Correção do Bug)
        const data = {
            tipo: selectTipo.value,
            campanha: campanhaId,
            valor: valorDoacao,
            descricao: inputDescricao.value
            // usuario é tratado no backend ou enviado como null (anônimo)
        };

        try {
            const response = await fetch(`${API_URL}/doacoes/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // Se tiver token, envia para registrar no nome do usuário
                    ...(AUTH_TOKEN ? { 'Authorization': `Token ${AUTH_TOKEN}` } : {})
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Transforma o erro do backend em texto legível
                throw new Error(JSON.stringify(errorData));
            }

            // Sucesso!
            form.reset();
            valorGroup.style.display = 'block'; // Reseta visual
            msgEl.className = 'success';
            msgEl.innerText = 'Doação registrada com sucesso! Muito obrigado.';
            msgEl.style.display = 'block';

        } catch (error) {
            console.error('Erro ao enviar doação:', error);
            msgEl.className = 'error';
            msgEl.innerText = 'Houve um erro ao registrar sua doação. Verifique os dados.';
            msgEl.style.display = 'block';
        }
    });
}

async function fetchInstituicoes() {
    const listEl = document.getElementById('instituicoes-list');
    
    // Se não estiver na página 'acoes.html', este elemento não existe, então sai da função
    if (!listEl) return;

    try {
        const response = await fetch(`${API_URL}/instituicoes/`);
        
        if (!response.ok) throw new Error('Erro ao buscar instituições');
        
        const instituicoes = await response.json();
        
        // Limpa o texto "A carregar..."
        listEl.innerHTML = ''; 
        
        // Se a lista estiver vazia
        if (instituicoes.length === 0) {
            listEl.innerHTML = '<p>Nenhuma instituição parceira registada no momento.</p>';
            return;
        }

        // Gera a lista de links
        instituicoes.forEach(inst => {
            const linkHTML = `
            <li>
                <a href="instituicao-detalhe.html?id=${inst.id}">
                    ${inst.nome}
                    <span>${inst.email || 'Ver detalhes'} &rarr;</span>
                </a>
            </li>
            `;
            listEl.insertAdjacentHTML('beforeend', linkHTML);
        });

    } catch (error) {
        console.error('Falha ao carregar instituições:', error);
        listEl.innerHTML = '<p>Não foi possível carregar as instituições no momento.</p>';
    }
}

function setupInteractiveChecklist() {
    // Seleciona todos os itens da lista dentro das categorias do checklist
    const items = document.querySelectorAll('.checklist-category li');
    
    // Se não encontrar itens (não estamos na página certa), sai da função
    if (items.length === 0) return;

    items.forEach(item => {
        // Adiciona o evento de clique em cada item
        item.addEventListener('click', () => {
            // Alterna a classe 'checked'
            // (O CSS que adicionámos vai riscar o texto e mostrar o ✔)
            item.classList.toggle('checked');
        });
    });
}

async function fetchInstituicaoDetalhe() {
    // Seleciona o container principal para poder mostrar erros se necessário
    const detailContainer = document.querySelector('.detail-content');
    
    // Se não estiver na página de detalhes, sai da função
    if (!detailContainer) return;

    try {
        // 1. Pega o ID da URL (ex: instituicao-detalhe.html?id=1)
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        
        if (!id) throw new Error('ID da instituição não encontrado na URL.');

        // 2. Chama a API
        const response = await fetch(`${API_URL}/instituicoes/${id}/`);
        
        if (!response.ok) throw new Error('Instituição não encontrada.');
        
        const inst = await response.json();

        // 3. Preenche os dados na tela
        document.title = `${inst.nome} - CyberWise`; // Atualiza o título da aba
        
        // Preenche os campos de texto
        // Usamos '||' para colocar um texto padrão caso o campo venha vazio do banco
        document.getElementById('detail-nome').innerText = inst.nome;
        document.getElementById('detail-email').innerText = inst.email || 'Não informado';
        document.getElementById('detail-telefone').innerText = inst.telefone || 'Não informado';
        document.getElementById('detail-endereco').innerText = inst.endereco || 'Não informado';

    } catch (error) {
        console.error('Falha ao carregar instituição:', error);
        // Mostra uma mensagem de erro amigável para o usuário
        detailContainer.innerHTML = '<h2>Erro ao carregar</h2><p>Não foi possível encontrar esta instituição. Tente voltar à página anterior.</p>';
    }
}

async function fetchUserProfile() {
    if (!AUTH_TOKEN) {
        window.location.href = 'login.html';
        return;
    }

    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${AUTH_TOKEN}` 
    };

    try {
        // 1. Busca Dados Básicos do Usuário
        const userRes = await fetch(`${API_URL}/auth/user/`, { headers });
        const user = await userRes.json();
        
        document.getElementById('profile-username').innerText = user.username;
        document.getElementById('profile-email').innerText = user.email;
        document.getElementById('profile-type').innerText = user.tipo || 'Usuário';

        // 2. Busca Minhas Campanhas
        const campRes = await fetch(`${API_URL}/campanhas/minhas/`, { headers });
        const campanhas = await campRes.json();
        const campList = document.getElementById('my-campaigns-list');
        
        if (campanhas.length > 0) {
            campList.innerHTML = '';
            campanhas.forEach(c => {
                // Reutiliza o card, mas simplificado
                let imgUrl = c.imagem_capa ? (c.imagem_capa.startsWith('http') ? c.imagem_capa : `${BASE_URL}${c.imagem_capa}`) : 'images/campanha-placeholder.jpg';
                campList.insertAdjacentHTML('beforeend', `
                    <a href="campanha-detalhe.html?id=${c.id}" class="campaign-card-link">
                        <div class="campaign-card">
                            <div class="campaign-image" style="height: 150px;">
                                <img src="${imgUrl}" onerror="this.src='images/campanha-placeholder.jpg'">
                            </div>
                            <div class="campaign-content" style="padding: 15px;">
                                <h4 style="font-size: 18px;">${c.titulo}</h4>
                            </div>
                        </div>
                    </a>
                `);
            });
        } else {
            campList.innerHTML = '<p>Você ainda não participa de nenhuma campanha.</p>';
        }

        // 3. Busca Minhas Doações
        const doaRes = await fetch(`${API_URL}/doacoes/`, { headers });
        const doacoes = await doaRes.json();
        const doaList = document.getElementById('my-donations-list');
        
        if (doacoes.length > 0) {
            doaList.innerHTML = '';
            doacoes.forEach(d => {
                const valor = d.valor ? `R$ ${d.valor}` : 'Material';
                const data = new Date(d.data_doacao).toLocaleDateString('pt-BR');
                doaList.insertAdjacentHTML('beforeend', `
                    <div class="profile-item-card">
                        <div>
                            <strong>${valor}</strong> <br>
                            <small>${d.tipo}</small>
                        </div>
                        <span>${data}</span>
                    </div>
                `);
            });
        } else {
            doaList.innerHTML = '<p>Nenhuma doação registrada.</p>';
        }

        // 4. Busca Meus Pedidos de Ajuda
        const ajuRes = await fetch(`${API_URL}/ajuda/`, { headers });
        const ajudas = await ajuRes.json();
        const ajuList = document.getElementById('my-help-list');
        
        if (ajudas.length > 0) {
            ajuList.innerHTML = '';
            ajudas.forEach(a => {
                const data = new Date(a.data_solicitacao).toLocaleDateString('pt-BR');
                // Badge de status simples
                let statusColor = a.status === 'concluida' ? 'green' : (a.status === 'pendente' ? 'orange' : 'blue');
                
                ajuList.insertAdjacentHTML('beforeend', `
                    <div class="profile-item-card">
                        <div>
                            <strong>${a.tipo.toUpperCase()}</strong> <br>
                            <small>${a.descricao.substring(0, 50)}...</small>
                        </div>
                        <div style="text-align:right">
                            <span style="color:${statusColor}; font-weight:bold;">${a.status.toUpperCase()}</span><br>
                            <span style="font-size:12px">${data}</span>
                        </div>
                    </div>
                `);
            });
        } else {
            ajuList.innerHTML = '<p>Nenhum pedido de ajuda realizado.</p>';
        }

    } catch (error) {
        console.error(error);
    }
}