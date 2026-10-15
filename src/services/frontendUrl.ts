export function getFrontendUrl(value: string): URL {
    const frontendUrl = new URL(value);

    if (!frontendUrl.pathname.endsWith('/')) {
        frontendUrl.pathname += '/';
    }

    return frontendUrl;
}

export function getFrontendRelativeLocation(
    frontendUrlValue: string,
    currentUrlValue: string = window.location.href
): string {
    const frontendUrl = getFrontendUrl(frontendUrlValue);
    const currentUrl = new URL(currentUrlValue);
    const basePath = frontendUrl.pathname === '/'
        ? ''
        : frontendUrl.pathname.slice(0, -1);

    let path = currentUrl.pathname;
    if (basePath && path.startsWith(`${basePath}/`)) {
        path = path.slice(basePath.length);
    } else if (path === basePath) {
        path = '/';
    }

    return `${path || '/'}${currentUrl.search}${currentUrl.hash}`;
}
