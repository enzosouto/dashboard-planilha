// Script principal
document.addEventListener('DOMContentLoaded', function() {
    fetchData();
});

async function fetchData() {
    try {
        const storedData = sessionStorage.getItem('data');
        let data = storedData ? JSON.parse(storedData) : null;

        if (!data) {
            const response = await fetch('https://api-google-sheets-7zph.vercel.app/getData');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            data = await response.json();
            sessionStorage.setItem('data', JSON.stringify(data.values));
        }

        // Converte e processa os dados
        const formattedData = formatData(data);
        const processedData = processDataForDisplay(formattedData);
        
        // Atualiza a tabela
        updateTable(processedData);
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Converte array de arrays em array de objetos
function formatData(data) {
    if (!Array.isArray(data) || data.length < 2) return [];
    
    const headers = data[0];
    console.log("Headers:", headers); // Para verificar o nome exato do campo orçamento
    
    return data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/ /g, '_')] = row[index] || '';
        });
        return obj;
    });
}

// Função para processar os dados
function processDataForDisplay(data) {
    const veiculando = [];
    const previstas = [];
    const finalizadas = [];
    
    function isCampanhaFinalizada(item) {
        const dataTermino = parseDate(item.data_de_término);
        const hoje = new Date();
        return dataTermino < hoje;
    }

    function isCampanhaPrevista(item) {
        const dataInicio = parseDate(item.data_de_início_prevista);
        const hoje = new Date();
        return dataInicio > hoje;
    }

    data.forEach(item => {
        const status = item.status_geral?.toLowerCase() || '';
        if (status.includes('veiculando')) {
            veiculando.push(item);
        } else if (isCampanhaFinalizada(item)) {
            finalizadas.push(item);
        } else {
            previstas.push(item);
        }
    });

    function parseDate(dateStr) {
        if (!dateStr) return new Date('9999-12-31');
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    }

    const sortByStartDate = (a, b) => {
        const dateA = parseDate(a.data_de_início_prevista);
        const dateB = parseDate(b.data_de_início_prevista);
        return dateA - dateB;
    };

    veiculando.sort(sortByStartDate);
    previstas.sort(sortByStartDate);
    finalizadas.sort(sortByStartDate);

    let combinedData = [...veiculando];
    
    const slotsAposVeiculando = 10 - combinedData.length;
    if (slotsAposVeiculando > 0) {
        combinedData = [
            ...combinedData,
            ...previstas.slice(0, slotsAposVeiculando)
        ];
    }

    const slotsRestantes = 10 - combinedData.length;
    if (slotsRestantes > 0) {
        combinedData = [
            ...combinedData,
            ...finalizadas.slice(0, slotsRestantes)
        ];
    }

    return combinedData.slice(0, 10);
}

// Função para atualizar a tabela
function updateTable(data) {
    const tbody = document.querySelector('table tbody');
    if (!tbody || !data) return;
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        // Linha principal da campanha
        const mainRow = `
    <tr class="campaign-row" onclick="toggleDetails('campaign${index}')">
        <td>
            <button class="expand-btn">
                <i class="fas fa-chevron-down"></i>
            </button>
        </td>
        <td>
            <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.campanha || 'N/D'}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">DSW: ${item.demanda || index}</div>
        </td>
        <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.órgão_demandante || 'N/D'}</td>
        <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.agência || 'N/D'}</td>
        <td>
            <span class="status-badge ${getStatusClass(item.status_geral)}">
                ${getStatusIcon(item.status_geral)} ${item.status_geral || 'N/D'}
            </span>
        </td>
        <td class="budget" style="white-space: nowrap;">${item.orçamento_total || 'R$ 0,00'}</td>
        <td class="campaign-type" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.praça || 'N/D'}</td>
        <td class="progress-cell">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${getProgress(item.status_geral)}%"></div>
            </div>
        </td>
    </tr>
`;
        
        // Linha de detalhes da campanha (mantida igual)
        // Substitua apenas a constante detailsRow no seu script por esta versão:
const detailsRow = `
<tr id="campaign${index}" class="details-row" style="display: none;">
    <td colspan="8">
        <div class="details-content">
            <div class="details-grid">
                <div class="details-section">
    <h4><i class="fas fa-bullseye"></i> Objetivo da Campanha</h4>
    <p style="white-space: pre-wrap; word-wrap: break-word; max-width: 400px; max-height: 100px; overflow-y: auto; font-size: 14px; color: var(--text-secondary); line-height: 1.5;">${item.objetivo_da_campanha || 'Informação não disponível'}</p>
</div>
                <div class="details-section">
                    <h4><i class="fas fa-tv"></i> Plano de Mídia</h4>
                    <ul>
                        ${formatMediaPlan(item.meios_de_veiculação)}
                    </ul>
                    <div style="margin-top: 10px;">
                        <small style="color: var(--text-secondary);">
                            <i class="fas fa-calendar"></i> Início: ${item.data_de_início_prevista || 'N/D'} 
                            | Término: ${item.data_de_término || 'N/D'}
                        </small>
                    </div>
                </div>
                <div class="details-section">
                    <h4><i class="fas fa-tasks"></i> Status do Projeto</h4>
                    <ul>
                        <li>
                            <i class="fas fa-file-alt"></i>
                            Status Conteúdo
                            <span class="status-badge ${getStatusClass(item.status_conteúdo)}" style="display: inline-block; white-space: normal; word-wrap: break-word; max-width: 400px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; padding: 5px; border-radius: 5px; background-color: var(--background-secondary);">
                                ${item.status_conteúdo || 'N/D'}
                            </span>
                        </li>




                        <li>
                            <i class="fas fa-broadcast-tower"></i>
                            Status Mídia
                            <span class="status-badge ${getStatusClass(item.status_mídia)}">
                                ${item.status_mídia || 'N/D'}
                            </span>
                        </li>
                        <li>
                            <i class="fas fa-file-contract"></i>
                            Formalização de Processo
                            <span class="status-badge ${getStatusClass(item.formalização_de_processo)}">
                                ${item.formalização_de_processo || 'N/D'}
                            </span>
                        </li>
                    </ul>
                </div>
                <div class="details-section">
                    <h4><i class="fas fa-users"></i> Assessores Responsáveis</h4>
                    <div class="deck-grid">
                        <div class="deck-item">
                            <span>Conteúdo: ${item.assessor_de_conteúdo || 'N/A'}</span>
                            <span>| Mídia: ${item.assessor_de_mídia || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </td>
</tr>
`;
        
        tbody.insertAdjacentHTML('beforeend', mainRow + detailsRow);
    });
}

// Funções auxiliares
function getStatusClass(status) {
    if (!status) return '';
    status = status.toLowerCase();
    if (status.includes('veiculando')) return 'status-active';
    if (status.includes('aprovação') || status.includes('produção')) return 'status-pending';
    return '';
}

function getStatusIcon(status) {
    if (!status) return '<i class="fas fa-circle"></i>';
    status = status.toLowerCase();
    if (status.includes('veiculando')) return '<i class="fas fa-broadcast-tower"></i>';
    if (status.includes('aprovação')) return '<i class="fas fa-clock"></i>';
    return '<i class="fas fa-circle"></i>';
}

function getProgress(status) {
    if (!status) return 0;
    status = status.toLowerCase();
    if (status.includes('veiculando')) return 100;
    if (status.includes('produção')) return 50;
    if (status.includes('aprovação')) return 30;
    return 0;
}

function formatMediaPlan(plan) {
    if (!plan) return '<li><i class="fas fa-info-circle"></i> Plano de mídia não disponível</li>';
    
    const items = plan.split(',').filter(item => item.trim());
    return items
        .map(item => `<li><i class="fas fa-check"></i> ${item.trim()}</li>`)
        .join('');
}

// Função para alternar visibilidade dos detalhes
function toggleDetails(campaignId) {
    const detailsRow = document.getElementById(campaignId);
    if (!detailsRow) return;
    
    const campaignRow = detailsRow.previousElementSibling;
    const expandBtn = campaignRow.querySelector('.expand-btn i');
    
    document.querySelectorAll('.details-row').forEach(row => {
        if (row.id !== campaignId) {
            row.style.display = 'none';
            row.classList.remove('show');
            const prevRow = row.previousElementSibling;
            if (prevRow) {
                prevRow.classList.remove('active');
                const btn = prevRow.querySelector('.expand-btn i');
                if (btn) btn.style.transform = 'rotate(0deg)';
            }
        }
    });

    const isHidden = detailsRow.style.display === 'none' || !detailsRow.style.display;
    detailsRow.style.display = isHidden ? 'table-row' : 'none';
    detailsRow.classList.toggle('show', isHidden);
    campaignRow.classList.toggle('active', isHidden);
    expandBtn.style.transform = isHidden ? 'rotate(-180deg)' : 'rotate(0deg)';
}