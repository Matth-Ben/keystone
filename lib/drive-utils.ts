export function getDriveEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Regex pour capturer l'ID après 'folders/'
    // Supporte :
    // - https://drive.google.com/drive/folders/ABC-123
    // - https://drive.google.com/drive/u/0/folders/ABC-123
    const regex = /folders\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);

    if (match && match[1]) {
        const folderId = match[1];
        return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    }

    return null;
}

export function isValidDriveUrl(url: string): boolean {
    if (!url) return false;
    const regex = /drive\.google\.com\/.*folders\/([a-zA-Z0-9_-]+)/;
    return regex.test(url);
}
