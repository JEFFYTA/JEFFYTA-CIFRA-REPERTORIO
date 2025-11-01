export const notaBase = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const notaMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
};

export function extrairCifras(texto: string): string {
    const linhas = texto.split('\n');
    let resultado: string[] = [];
    let secaoAtual: string | null = null;
    let conteudoSecao: string[] = [];

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i];
        let trim = linha.trim();

        if (!trim) continue;

        // Check for section headers like [Verse], (Chorus), {Bridge}
        if (/^\[.*\]$|^\(.*\)$|^{.*}$/.test(trim)) {
            if (secaoAtual && conteudoSecao.length > 0) {
                resultado.push(secaoAtual);
                resultado = resultado.concat(conteudoSecao);
                if (i < linhas.length - 1) resultado.push(''); // Add a blank line between sections
            }
            secaoAtual = trim;
            conteudoSecao = [];
            continue;
        }

        // Handle the very first line if it's not a section and might be a title
        if (!secaoAtual && i === 0) {
            resultado.push(trim);
            if (linhas.length > 1) resultado.push('');
            continue;
        }

        // If inside a section, check for chords
        if (secaoAtual) {
            // Regex to find common chord patterns
            const regex = /[CDEFGAB][#b]?m?(°|6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?/g;
            const cifras = linha.match(regex) || [];
            const validas = cifras.filter(c => {
                const raizMatch = c.match(/[CDEFGAB][#b]?/);
                return raizMatch && notaMap[raizMatch[0]] !== undefined;
            });
            if (validas.length > 0) {
                conteudoSecao.push(linha);
            }
        }
    }

    // Add the last section if it exists
    if (secaoAtual && conteudoSecao.length > 0) {
        resultado.push(secaoAtual);
        resultado = resultado.concat(conteudoSecao);
    }

    return resultado.join('\n');
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