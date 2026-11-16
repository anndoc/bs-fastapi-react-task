from enum import StrEnum

RETRIEVAL_LIMIT = 5
# Tune per embedding model: unrelated chunks sit near 1.0 for most providers.
MAX_COSINE_DISTANCE = 0.5
TITLE_MAX_LENGTH = 200
NO_CONTEXT_ANSWER = "I couldn't find information about this in the uploaded documents."

PROMPT = """
You are an assistant that answers questions using only the provided context.
Each context excerpt starts with its source as [file name, page N].

If the context does not contain the answer, say that you don't know.
Do not use outside knowledge and do not invent facts.
Cite the sources you used as [file name, page N].

Context:
---
{context}
---

User question:
{query}
"""


class ChatEvent(StrEnum):
    init = "init"
    sources = "sources"
    reasoning = "reasoning"
    text = "text"
    done = "done"
    stop = "stop"


class MessageRole(StrEnum):
    user = "user"
    assistant = "assistant"
