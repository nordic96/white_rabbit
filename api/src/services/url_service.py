import httpx
import validators


async def url_exists(url: str) -> bool:
    """Asynchronously check if URL exists.

    Args:
        url: URL string to check.

    Returns:
        True if url is valid and exists, False otherwise.
    """
    if not validators.url(url):
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, timeout=5.0, follow_redirects=True)
            return response.is_success
    except httpx.HTTPError:
        return False
