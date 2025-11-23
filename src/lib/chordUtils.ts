export const notaBase = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const notaMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
};

export function extrairCifras(texto: string | null | undefined): string {
    const safeText = typeof texto === 'string' ? texto : '';
    const linhas = safeText.split('\n');
    let resultado: string[] = [];

    // Regex para encontrar padrões de cifra comuns, incluindo baixo invertido
    // Ex: C, C#m7, G/B, F7M/C
    // Adicionado '4' como uma extensão válida
    const chordRegex = /([CDEFGAB][#b]?)(m|°)?(4|6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?(\/[CDEFGAB][#b]?)?/g;
    const CHORD_SPACING = 6; // Número de espaços entre as cifras

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i];
        let trim = linha.trim();

        // Manter linhas em branco para preservar a estrutura
        if (!trim) {
            resultado.push('');
            continue;
        }

        // Manter cabeçalhos de seção como [Verse], (Chorus), {Bridge}
        if (/^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim)) {
            resultado.push(trim);
            continue;
        }

        // Verificar se a linha contém cifras válidas
        const potentialChords = [...linha.matchAll(chordRegex)]; // Usar matchAll para obter todas as ocorrências
        const validChordsWithIndices = potentialChords.filter(match => {
            const raizMatch = match[1].match(/[CDEFGAB][#b]?/);
            return raizMatch && notaMap[raizMatch[0]] !== undefined;
        });

        if (validChordsWithIndices.length > 0) {
            let lineWithoutChords = linha;
            for (const match of validChordsWithIndices) {
                lineWithoutChords = lineWithoutChords.replace(match[0], ' '.repeat(match[0].length));
            }

            const remainingText = lineWithoutChords.replace(/[\s.,!?;:'"-]/g, '').trim();
            const containsWords = /[a-zA-Z]{2,}/.test(remainingText);

            if (!containsWords) {
                // É uma linha de cifra, formatar com espaçamento fixo
                const chordsOnLine = validChordsWithIndices.map(match => match[0]);
                if (chordsOnLine.length > 0) {
                    resultado.push(chordsOnLine.join(' '.repeat(CHORD_SPACING)));
                } else {
                    resultado.push('');
                }
            } else {
                resultado.push(''); // Contém cifras e palavras, descartar
            }
        } else {
            resultado.push(''); // Nenhuma cifra válida, descartar
        }
    }

    // Limpar múltiplas linhas em branco consecutivas, mantendo apenas uma
    let cleanedResult: string[] = [];
    let lastWasBlank = false;
    for (const line of resultado) {
        if (line.trim() === '') {
            if (!lastWasBlank) {
                cleanedResult.push('');
            }
            lastWasBlank = true;
        } else {
            cleanedResult.push(line);
            lastWasBlank = false;
        }
    }

    return cleanedResult.join('\n');
}

export function extractSongTitle(text: string | null | undefined): string {
    const safeText = typeof text === 'string' ? text : '';
    const lines = safeText.split('\n');
    // Adicionado '4' como uma extensão válida
    const chordRegex = /([CDEFGAB][#b]?)(m|°)?(4|6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?(\/[CDEFGAB][#b]?)?/g;

    for (const line of lines) {
        const trim = line.trim();
        // Ignorar linhas vazias, cabeçalhos de seção, "Intro:" ou "Tom:"
        if (!trim || /^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim) || trim.toLowerCase().startsWith('intro:') || trim.toLowerCase().startsWith('tom:')) {
            continue;
        }

        // Verificar se a linha é predominantemente uma linha de cifra
        const potentialChords = [...trim.matchAll(chordRegex)];
        const validChords = potentialChords.filter(match => {
            const raizMatch = match[1].match(/[CDEFGAB][#b]?/);
            return raizMatch && notaMap[raizMatch[0]] !== undefined;
        });

        // Heurística: se mais de 50% da linha (em caracteres) é composta por cifras válidas,
        // ou se há muitas cifras e poucas palavras, provavelmente é uma linha de cifra.
        const totalChordLength = validChords.reduce((sum, match) => sum + match[0].length, 0);
        const nonChordTextLength = trim.length - totalChordLength;

        if (validChords.length > 0 && (totalChordLength / trim.length > 0.5 || (validChords.length > 2 && nonChordTextLength < 5))) {
            continue; // Pular, provavelmente é uma linha de cifra
        }

        // Se chegou aqui, é uma linha não vazia, não é cabeçalho de seção, não é "Intro:"/"Tom:" e não é predominantemente cifra.
        // Consideramos como título.
        return trim;
    }
    return ''; // Nenhum título encontrado
}

export function transposeChordLine(line: string | null | undefined, delta: number): string {
    const safeLine = typeof line === 'string' ? line : '';
    const trim = safeLine.trim();
    // Não transpor cabeçalhos de seção ou linhas em branco
    if (!trim || /^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim)) {
        return safeLine;
    }

    // Regex para capturar raiz, tipo (m/°), extensões e baixo invertido
    // Ex: F7M/C -> match[1]=F, match[2]=undefined, match[3]=7M, match[4]=/C
    // Adicionado '4' como uma extensão válida
    const chordPartRegex = /^([CDEFGAB][#b]?)(m|°)?(4|6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?(\/[CDEFGAB][#b]?)?$/;

    // Dividir a linha por espaços para lidar com múltiplas cifras em uma linha
    const parts = safeLine.split(/(\s+)/); // Manter delimitadores para preservar o espaçamento

    const transposedParts = parts.map(p => {
        // Processar apenas se não for apenas espaço em branco
        if (p.trim() === '') return p;

        const match = p.match(chordPartRegex);
        if (!match) return p; // Não é uma cifra reconhecida, retornar como está

        const raiz = match[1]; // ex: C, G#, Bb
        const tipo = match[2] || ''; // ex: m, °
        const ext = match[3] || ''; // ex: 7M, add9
        const bassNotePart = match[4] || ''; // ex: ex: /C

        const idx = notaMap[raiz];
        if (idx === undefined) return p; // Raiz não reconhecida, retornar como está

        const newIdx = (idx + delta + 12) % 12; // Garantir índice positivo
        let transposedChord = notaBase[newIdx] + tipo + ext;

        if (bassNotePart) {
            const bassRaiz = bassNotePart.substring(1); // Remove o '/'
            const bassIdx = notaMap[bassRaiz];
            if (bassIdx !== undefined) {
                const newBassIdx = (bassIdx + delta + 12) % 12;
                transposedChord += '/' + notaBase[newBassIdx];
            } else {
                transposedChord += bassNotePart; // Se o baixo não for reconhecido, mantém o original
            }
        }

        return transposedChord;
    });

    return transposedParts.join('');
}