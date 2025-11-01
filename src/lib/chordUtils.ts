export const notaBase = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const notaMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
};

export function extrairCifras(texto: string): string {
    const linhas = texto.split('\n');
    let resultado: string[] = [];

    // Regex para encontrar padrões de cifra comuns
    const chordRegex = /([CDEFGAB][#b]?m?(°|6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?)/g;
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

        // Tratamento especial para a primeira linha não-vazia e não-seção como um possível título
        if (i === 0 && resultado.length === 0) {
            const potentialChordsInFirstLine = trim.match(chordRegex) || [];
            const validChordsInFirstLine = potentialChordsInFirstLine.filter(c => {
                const raizMatch = c.match(/[CDEFGAB][#b]?/);
                return raizMatch && notaMap[raizMatch[0]] !== undefined;
            });

            if (validChordsInFirstLine.length === 0) { // Se não houver cifras, é provavelmente um título
                resultado.push(trim);
                continue;
            }
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

export function transposeChordLine(line: string, delta: number): string {
    const trim = line.trim();
    // Não transpor cabeçalhos de seção ou linhas em branco
    if (!trim || /^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim)) {
        return line;
    }

    // Dividir a linha por espaços para lidar com múltiplas cifras em uma linha
    const parts = line.split(/(\s+)/); // Manter delimitadores para preservar o espaçamento

    const transposedParts = parts.map(p => {
        // Processar apenas se não for apenas espaço em branco
        if (p.trim() === '') return p;

        // Regex para capturar raiz, menor/diminuto e extensões
        const match = p.match(/^([CDEFGAB][#b]?)(m|°)?(.*)$/);
        if (!match) return p; // Não é uma cifra, retornar como está

        const raiz = match[1]; // ex: C, G#, Bb
        const tipo = match[2] || ''; // ex: m, °
        const ext = match[3]; // ex: 7, add9, sus4

        const idx = notaMap[raiz];
        if (idx === undefined) return p; // Raiz não reconhecida, retornar como está

        const newIdx = (idx + delta + 12) % 12; // Garantir índice positivo
        return notaBase[newIdx] + tipo + ext;
    });

    return transposedParts.join('');
}