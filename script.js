/* =======================================================
   CONFIGURAÇÃO INICIAL DO MAPA
   ======================================================= */

const map = L.map('map').setView([-3.79, -52.29], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/* =======================================================
   CARREGAMENTO DOS DADOS (GEOJSON E DADOS DE LIXO)
   ======================================================= */

Promise.all([
    fetch('municipios-para.geojson'), // Carrega os polígonos dos municípios
    fetch('dados-lixo.json')          // Carrega seus dados de lixo
])
.then(responses => Promise.all(responses.map(res => res.json())))
.then(([municipiosGeo, dadosLixo]) => {

    console.log("GeoJSON carregado.");
    console.log("Dados de lixo carregados:", dadosLixo);

    L.geoJson(municipiosGeo, {

        style: function(feature) {
            const nomeMunicipio = feature.properties.NM_MUN;

            if (dadosLixo[nomeMunicipio]) {
                return {
                    fillColor: '#FFA500',
                    color: '#007BFF',
                    weight: 1.5,
                    fillOpacity: 0.7
                };
            } else {
                return {
                    fillColor: '#007BFF',
                    color: '#FFF',
                    weight: 1,
                    fillOpacity: 0.5
                };
            }
        },

        // Função executada para CADA município (cria os popups)
        onEachFeature: function(feature, layer) {
            const nomeMunicipio = feature.properties.NM_MUN;
            const dadosDoMunicipio = dadosLixo[nomeMunicipio];

            let popupContent = `<h3>${nomeMunicipio}</h3>`;

            if (dadosDoMunicipio) {
                popupContent += `
                    <strong>Tipo de Lixo:</strong> ${dadosDoMunicipio.tipo}<br>
                    <strong>Volume (ton):</strong> ${dadosDoMunicipio.volume}<br>
                    <strong>Origem Principal:</strong> ${dadosDoMunicipio.origem}<br>
                    <strong>Observação:</strong> ${dadosDoMunicipio.obs || 'N/A'}
                    <hr>
                `;

                let imagensHtml = '';
                if (dadosDoMunicipio.imagens && dadosDoMunicipio.imagens.length > 0) {
                    imagensHtml = '<h4>Imagens Coletadas (clique para ampliar):</h4><div class="miniaturas-container">';

                    dadosDoMunicipio.imagens.forEach((imgData, index) => {

                        // --- INÍCIO DA ATUALIZAÇÃO ---
                        // Criamos o texto que aparecerá no hover (tooltip)
                        const marca = imgData.marca || 'Não identificada';
                        const origem = imgData.origem_especifica || 'Desconhecida';
                        const titleText = `Origem: ${origem} | Marca: ${marca}`;
                        // --- FIM DA ATUALIZAÇÃO ---

                        // Adicionamos o atributo 'title' na tag <img>
                        imagensHtml += `<img src="${imgData.caminho}"
                                             class="popup-imagem"
                                             alt="Resíduo internacional"
                                             title="${titleText}"
                                             data-index="${index}">`;
                    });
                    imagensHtml += '</div>';
                }
                popupContent += imagensHtml;

            } else {
                popupContent += "<i>Dados sobre lixos internacionais não disponíveis.</i>";
            }

            layer.bindPopup(popupContent);

            layer.on('popupopen', function() {
                const imagensMiniatura = document.querySelectorAll('.popup-imagem');

                imagensMiniatura.forEach(imagem => {
                    imagem.addEventListener('click', function() {
                        const index = this.dataset.index;
                        const imageData = dadosDoMunicipio.imagens[index];

                        // Atualiza o modal (não mudou, mas usa os dados novos)
                        document.getElementById('modal-image-full').src = imageData.caminho;
                        document.getElementById('modal-image-origin').innerHTML = `<strong>Origem:</strong> ${imageData.origem_especifica}`;
                        document.getElementById('modal-image-description').innerHTML = `<strong>Descrição:</strong> ${imageData.descricao || 'N/A'}`;

                        document.getElementById('modal-imagem').style.display = 'flex';
                    });
                });
            });
        }

    }).addTo(map);

})
.catch(error => {
    console.error('Erro ao carregar os arquivos de dados:', error);
    alert('Não foi possível carregar os dados do mapa. Verifique o console (F12) para mais detalhes.');
});


/* =======================================================
   LÓGICA DO MODAL (POPUP DE IMAGEM AMPLIADA)
   ======================================================= */

const modal = document.getElementById('modal-imagem');
const closeButton = document.querySelector('.close-button');

closeButton.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});