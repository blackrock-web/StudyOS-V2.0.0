# Drop your trained BGE checkpoint here

This folder is a **placeholder / drop-zone** for a fine-tuned embedding model
(for example the output of `training/COLAB_RAG_EMBEDDING_TRAINING.py`).

## How it works

- While this folder is **empty**, RAGBook Studio uses the stock
  `BAAI/bge-small-en-v1.5` model from the HuggingFace Hub.
- The moment you place a trained `SentenceTransformer`-format checkpoint
  here, it is picked up **automatically** on the next model scan — no code
  or config changes needed. The adapter
  (`Adapters/embedding/sentence_transformers_adapter.py`) always prefers a
  populated `weights/` folder over the hub name.

## What to put here

Either:

1. **A folder's contents**, saved with `model.save_pretrained(...)` /
   `SentenceTransformer.save(...)`, i.e.:
   - `config.json`
   - `model.safetensors` (or `pytorch_model.bin`)
   - `tokenizer.json`, `tokenizer_config.json`, `vocab.txt`
   - `sentence_bert_config.json`, `modules.json`

2. **Or a single `.zip`** containing the above. Just paste the zip file into
   this folder — RAGBook Studio will **auto-extract it** the next time the
   model registry scans (on backend startup, or via `POST /api/models/rescan`
   if exposed), and it will be deleted after extraction.

## Verifying it took effect

Check `GET /api/models` (or the Models page in the UI) — the entry for
`bge-small-en-v1.5` will show `"using_custom_weights": true` in its `extra`
once your checkpoint is detected, and every subsequent embed/search call
will use your model instead of the hub default.
