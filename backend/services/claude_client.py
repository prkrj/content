"""
Claude API Client - Handles all interactions with Anthropic's Claude API
"""
import os
import anthropic
from typing import Dict, Any, Optional, AsyncIterator
from core.config import settings


class ClaudeClient:
    """Wrapper for Anthropic's Claude API with streaming and non-streaming support."""

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY or ""
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        # Using Claude 3 Sonnet - stable, widely available model
        # This is the standard Sonnet model that should work with all API keys
        self.default_model = "claude-3-sonnet-20240229"
        self.max_tokens = 8000

    async def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 1.0,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate a non-streaming response from Claude.

        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to set context
            model: Claude model to use (defaults to latest Sonnet)
            temperature: Randomness (0-1)
            max_tokens: Maximum tokens in response

        Returns:
            Generated text response
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            kwargs = {
                "model": model or self.default_model,
                "messages": messages,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature,
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            response = self.client.messages.create(**kwargs)

            # Extract text from response
            return response.content[0].text

        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")

    async def generate_streaming(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 1.0,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """
        Generate a streaming response from Claude.

        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to set context
            model: Claude model to use
            temperature: Randomness (0-1)
            max_tokens: Maximum tokens in response

        Yields:
            Text chunks as they arrive
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            kwargs = {
                "model": model or self.default_model,
                "messages": messages,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature,
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            with self.client.messages.stream(**kwargs) as stream:
                for text in stream.text_stream:
                    yield text

        except Exception as e:
            raise Exception(f"Claude API streaming error: {str(e)}")

    async def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (approximate).
        Claude uses ~4 characters per token on average.
        """
        return len(text) // 4


# Singleton instance
_claude_client: Optional[ClaudeClient] = None


def get_claude_client() -> ClaudeClient:
    """Get or create the Claude client singleton."""
    global _claude_client
    if _claude_client is None:
        _claude_client = ClaudeClient()
    return _claude_client
