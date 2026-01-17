#!/usr/bin/env python3
"""
Audio Generation Script for White Rabbit

This script generates audio files for all mystery quotes using the Kokoro TTS model.
Generated audio files are saved with the mystery_id as the filename for easy
deployment to GitHub Pages or CDN.

Usage:
    cd api
    python ../scripts/generate_audio.py

Output:
    ./generated_audio/{mystery_id}.wav

Requirements:
    - Run from the api directory (for proper imports)
    - Kokoro TTS dependencies installed
    - Neo4j connection (optional, for mystery metadata)
"""

import json
import os
import sys
from pathlib import Path

# Add the api/src directory to Python path
api_dir = Path(__file__).parent.parent / "api"
sys.path.insert(0, str(api_dir))

import numpy as np
import soundfile as sf


def load_quotes(messages_path: Path) -> dict[str, str]:
    """Load quotes from the Next.js messages file."""
    with open(messages_path, "r", encoding="utf-8") as f:
        messages = json.load(f)
    return messages.get("Quotes", {})


def generate_audio_for_quote(
    mystery_id: str,
    text: str,
    output_dir: Path,
    pipeline,
    voice_id: str = "bm_fable",
    sample_rate: int = 24000,
) -> bool:
    """Generate audio for a single quote.

    Args:
        mystery_id: Unique mystery identifier
        text: Quote text to convert to speech
        output_dir: Directory to save audio files
        pipeline: Kokoro TTS pipeline instance
        voice_id: Voice ID to use
        sample_rate: Audio sample rate

    Returns:
        True if successful, False otherwise
    """
    output_path = output_dir / f"{mystery_id}.wav"

    # Skip if already generated
    if output_path.exists():
        print(f"  [SKIP] {mystery_id} - already exists")
        return True

    try:
        print(f"  [GEN] {mystery_id} ({len(text)} chars)")

        # Generate audio chunks
        generator = pipeline(text, voice=voice_id)
        audio_chunks = []

        for gs, ps, audio in generator:
            audio_chunks.append(audio)

        if not audio_chunks:
            print(f"  [ERROR] {mystery_id} - no audio generated")
            return False

        # Combine all audio chunks
        combined_audio = np.concatenate(audio_chunks)

        # Save to file
        sf.write(str(output_path), combined_audio, sample_rate)
        print(f"  [OK] {mystery_id} - saved ({len(combined_audio)} samples)")
        return True

    except Exception as e:
        print(f"  [ERROR] {mystery_id} - {e}")
        return False


def main():
    """Main entry point for audio generation."""
    # Paths
    project_root = Path(__file__).parent.parent
    messages_path = project_root / "web" / "messages" / "en.json"
    output_dir = project_root / "generated_audio"

    print("=" * 60)
    print("White Rabbit Audio Generation Script")
    print("=" * 60)

    # Check messages file exists
    if not messages_path.exists():
        print(f"ERROR: Messages file not found: {messages_path}")
        sys.exit(1)

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")

    # Load quotes
    quotes = load_quotes(messages_path)
    print(f"Found {len(quotes)} quotes to generate")
    print()

    # Import Kokoro (lazy import to avoid loading if not needed)
    try:
        from kokoro import KPipeline

        print("Loading Kokoro TTS model...")
        pipeline = KPipeline(lang_code="b")  # British English
        print("Model loaded successfully!")
        print()
    except ImportError:
        print("ERROR: Kokoro not installed. Install with: pip install kokoro")
        print("       Run this script from the api directory after installing dependencies.")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to load Kokoro model: {e}")
        sys.exit(1)

    # Generate audio for each quote
    success_count = 0
    skip_count = 0
    error_count = 0

    print("Generating audio files...")
    print("-" * 60)

    for mystery_id, quote_text in quotes.items():
        output_path = output_dir / f"{mystery_id}.wav"

        if output_path.exists():
            skip_count += 1
            print(f"  [SKIP] {mystery_id}")
            continue

        if generate_audio_for_quote(
            mystery_id=mystery_id,
            text=quote_text,
            output_dir=output_dir,
            pipeline=pipeline,
        ):
            success_count += 1
        else:
            error_count += 1

    print("-" * 60)
    print()
    print("Generation Complete!")
    print(f"  Generated: {success_count}")
    print(f"  Skipped:   {skip_count}")
    print(f"  Errors:    {error_count}")
    print(f"  Total:     {len(quotes)}")
    print()
    print(f"Audio files saved to: {output_dir}")
    print()
    print("Next steps:")
    print("  1. Review generated audio files")
    print("  2. Upload to your GitHub assets repository")
    print("  3. Enable GitHub Pages on the repository")
    print("  4. Update AUDIO_BASE_URL in production environment")


if __name__ == "__main__":
    main()
