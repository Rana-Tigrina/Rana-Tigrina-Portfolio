---
title: Production RAG & Observability Harness
kind: Enterprise intelligence
object: A grocer's brass scale
image: /art/scale.webp
metric: "87%"
metricLabel: Retrieval precision (P@5)
stack: [LangChain, ChromaDB, RAGAS, LangSmith, Docker]
summary: High-throughput enterprise document intelligence using semantic chunking, cross-encoder reranking and an automated GitHub Actions CI evaluation gate.
graph: [Documents, Semantic chunks, Vector search, Reranker, Answer, RAGAS gate]
invariants:
  - Faithfulness and context precision are scored on every pull request
  - A change that lowers retrieval quality fails CI and does not ship
  - Latency and token cost are traced per request
link: https://github.com/Rana-Tigrina
---
A taraazu, a grocer's scale, with all its little brass weights. Nothing leaves my well
now without being weighed. Is it faithful to what I fetched? Is it what was asked? If
the pan dips the wrong way the answer stays down here with me.
