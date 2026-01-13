"""
TTS Model Manager for Kokoro-82M pipeline.

This module provides a singleton manager for the Kokoro TTS pipeline
with lazy loading and thread-safe initialization.
"""
import asyncio
import logging
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from ..config import settings
from ..exceptions import TTSModelNotReadyError, TTSGenerationError

logger = logging.getLogger(__name__)

# Thread pool for CPU-bound TTS operations
_executor = ThreadPoolExecutor(max_workers=2)


class TTSModelManager:
    """
    Singleton manager for Kokoro TTS pipeline.

    Handles lazy loading, thread-safe initialization, and cleanup
    of the Kokoro TTS model.
    """
    _instance: Optional['TTSModelManager'] = None
    _lock: Optional[asyncio.Lock] = None

    def __init__(self):
        """Initialize the manager (private - use get_instance instead)."""
        self._pipeline = None
        self._is_loading = False
        self._initialization_error: Optional[Exception] = None

    @classmethod
    async def get_instance(cls) -> 'TTSModelManager':
        """
        Get or create the singleton instance.

        Returns:
            TTSModelManager: The singleton instance
        """
        if cls._lock is None:
            cls._lock = asyncio.Lock()
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _load_pipeline_sync(self):
        """
        Synchronously load the Kokoro pipeline (runs in executor).

        This method is executed in a thread pool to avoid blocking
        the async event loop during model loading.
        """
        try:
            from kokoro import KPipeline
            logger.info(f"Loading Kokoro TTS pipeline with lang_code='{settings.tts_lang_code}'")
            pipeline = KPipeline(lang_code=settings.tts_lang_code)
            logger.info("Kokoro TTS pipeline loaded successfully")
            return pipeline
        except Exception as e:
            logger.error(f"Failed to load Kokoro pipeline: {e}")
            raise TTSGenerationError(
                message=f"Failed to initialize TTS model: {str(e)}",
                details={"error_type": type(e).__name__}
            )

    async def get_pipeline(self):
        """
        Get the Kokoro pipeline, loading it if necessary.

        Returns:
            KPipeline: The loaded Kokoro pipeline

        Raises:
            TTSModelNotReadyError: If pipeline is not ready or failed to load
            TTSGenerationError: If pipeline initialization fails
        """
        # If already loaded, return immediately
        if self._pipeline is not None:
            return self._pipeline

        # If lazy loading is disabled, raise error
        if not settings.tts_lazy_load:
            raise TTSModelNotReadyError(
                message="TTS model not initialized and lazy loading is disabled"
            )

        # Check if initialization previously failed
        if self._initialization_error is not None:
            raise TTSModelNotReadyError(
                message=f"TTS model initialization failed: {str(self._initialization_error)}",
                details={"error_type": type(self._initialization_error).__name__}
            )

        # Use lock to prevent multiple simultaneous loads
        async with self._lock:
            # Double-check after acquiring lock
            if self._pipeline is not None:
                return self._pipeline

            if self._is_loading:
                # Wait for the other thread to finish loading
                logger.info("Another thread is loading the pipeline, waiting...")
                while self._is_loading:
                    await asyncio.sleep(0.1)

                if self._pipeline is not None:
                    return self._pipeline
                else:
                    raise TTSModelNotReadyError(
                        message="TTS model loading failed in another thread"
                    )

            # Start loading
            self._is_loading = True
            try:
                loop = asyncio.get_event_loop()
                self._pipeline = await loop.run_in_executor(
                    _executor,
                    self._load_pipeline_sync
                )
                return self._pipeline
            except Exception as e:
                self._initialization_error = e
                logger.error(f"Failed to load TTS pipeline: {e}")
                raise
            finally:
                self._is_loading = False

    async def cleanup(self):
        """
        Cleanup the pipeline and free resources.

        This should be called during application shutdown.
        """
        async with self._lock:
            if self._pipeline is not None:
                logger.info("Cleaning up Kokoro TTS pipeline")
                self._pipeline = None

    def is_initialized(self) -> bool:
        """
        Check if the pipeline is initialized.

        Returns:
            bool: True if pipeline is loaded, False otherwise
        """
        return self._pipeline is not None


async def get_tts_pipeline():
    """
    Convenience function to get the TTS pipeline.

    Returns:
        KPipeline: The loaded Kokoro pipeline

    Raises:
        TTSModelNotReadyError: If pipeline is not ready
        TTSGenerationError: If pipeline initialization fails
    """
    manager = await TTSModelManager.get_instance()
    return await manager.get_pipeline()


async def warmup_tts_model():
    """
    Preload the TTS model for faster first request.

    This can be called during application startup or via
    a dedicated warmup endpoint.

    Raises:
        TTSGenerationError: If model loading fails
    """
    logger.info("Warming up TTS model...")
    await get_tts_pipeline()
    logger.info("TTS model warmup complete")


async def cleanup_tts_model():
    """
    Cleanup TTS model resources.

    This should be called during application shutdown.
    """
    manager = await TTSModelManager.get_instance()
    await manager.cleanup()


def is_tts_model_ready() -> bool:
    """
    Check if TTS model is ready without triggering load.

    Returns:
        bool: True if model is loaded and ready
    """
    if TTSModelManager._instance is None:
        return False
    return TTSModelManager._instance.is_initialized()
