export function shortenString(str, maxLength = 30) {
    if (!str) return ''
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}