import validators
import httpx

async def url_exists(url: str) -> bool:
    """Asynschronously check if URL exists
    
    Args:
        url (str): url string to check

    Returns:
        bool: true if url is valid and exists, else return false
    """
    if not validators.url(url):
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, timeout=5.0, follow_redirects=True)
            return 200 <= response.status_code < 300
    
    except httpx.ConnectError:
        # Handle Connection Errors (e.g. DNS issues, server down)
        return False
    except httpx.TimeoutException:
        # Handle Timeouts
        return False
    except Exception:
        # Handle other potential exceptions
        return False