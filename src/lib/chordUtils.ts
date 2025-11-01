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
        // Isso garante que o título da música seja mantido se não for uma linha de cifra
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
            // Se houver cifras, a linha será processada pela lógica de linha de cifra abaixo
        }

        // Verificar se a linha contém cifras válidas
        const potentialChords = linha.match(chordRegex) || [];
        const validChords = potentialChords.filter(c => {
            const raizMatch = c.match(/[CDEFGAB][#b]?/);
            return raizMatch && notaMap[raizMatch[0]] !== undefined;
        });

        if (validChords.length > 0) {
            // Se houver cifras válidas, verificar se é principalmente uma linha de cifra
            let lineWithoutChords = linha;
            for (const chord of validChords) {
                // Substituir cifras por espaços para manter o espaçamento original
                lineWithoutChords = lineWithoutChords.replace(chord, ' '.repeat(chord.length));
            }

            // Remover caracteres não-espaço que não sejam pontuação para verificar se restam palavras
            const remainingText = lineWithoutChords.replace(/[\s.,!?;:'"-]/g, '').trim();

            // Considerar uma linha de cifra se não contiver palavras significativas (2 ou mais letras)
            const containsWords = /[a-zA-Z]{2,}/.test(remainingText);

            if (!containsWords) {
                resultado.push(linha); // É uma linha de cifra, manter como está
            } else {
                // Contém cifras, mas também palavras significativas, então é uma linha de letra com cifras embutidas.
                // Descartar, substituindo por uma linha em branco.
                resultado.push('');
            }
        } else {
            // Nenhuma cifra válida encontrada, é uma linha de letra, descartar (substituir por linha em branco)
            resultado.push('');
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
    // Don't transpose section headers or empty lines
    if (!trim || /^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim)) {
        return line;
    }

    // Split the line by spaces to handle multiple chords on one line
    const parts = line.split(/(\s+)/); // Keep delimiters to preserve spacing

    const transposedParts = parts.map(p => {
        // Only process if it's not just whitespace
        if (p.trim() === '') return p;

        // Regex to capture root, minor/diminished, and extensions
        const match = p.match(/^([CDEFGAB][#b]?)(m|°)?(.*)$/);
        if (!match) return p; // Not a chord, return as is

        const raiz = match[1]; // e.g., C, G#, Bb
        const tipo = match[2] || ''; // e.g., m, °
        const ext = match[3]; // e.g., 7, add9, sus4

        const idx = notaMap[raiz];
        if (idx === undefined) return p; // Root not recognized, return as is

        const newIdx = (idx + delta + 12) % 12; // Ensure positive index
        return notaBase[newIdx] + tipo + ext;
    });

    return transposedParts.join('');
}