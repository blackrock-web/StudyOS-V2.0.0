# Drop a GGUF LLM here

This is a **placeholder / drop-zone** for a local generation model.

## How it works

- Until a `.gguf` file exists in this folder (or anywhere under this model's
  directory), this model stays **disabled**, and Chat responses fall back to
  showing the retrieved, cited passages directly (no hallucinated answer —
  see `Backend/app/api/routes/chat.py::chat()`).
- The moment a `.gguf` file is dropped here, the model registry marks it
  `ready` and **auto-enables** it (`extra.auto_enable: true`) on the next
  scan. Chat then routes through `Adapters/llm/llama_cpp_adapter.py` and you
  get real generated, cited answers.

## What to put here

Any GGUF-quantized chat model works, e.g.:
- `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`
- `Phi-3.5-mini-instruct-Q4_K_M.gguf`
- `Qwen2.5-7B-Instruct-Q4_K_M.gguf`

Just copy (or paste a `.zip` containing) the `.gguf` file into this folder.
`llama-cpp-python` must be installed (`Backend/requirements.txt` already
includes it) and enough RAM/VRAM for the quant size you choose.

## Using a hosted API model instead

If you'd rather call a hosted API (OpenAI-compatible, Anthropic, etc.)
instead of running locally, implement `BaseLLMProvider` in a `model.py` next
to a new `metadata.json` under `Models/LLMs/<your-model>/` — the registry
will pick it up automatically the same way (see
`Core/registry/model_registry.py::_instantiate`).
