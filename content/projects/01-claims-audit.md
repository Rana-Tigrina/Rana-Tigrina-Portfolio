---
title: Healthcare Claims Multi-Agent Audit System
kind: Autonomous multi-agent
object: A moneylender's red ledger
image: /art/ledger.webp
metric: "91%"
metricLabel: Adjudication precision
stack: [LangGraph, Gemini 3.8 Flash, ChromaDB, Python, Pydantic v2]
summary: Deterministic CPT/ICD overlap pre-matching with a LangGraph StateGraph pipeline. It routes to Gemini 3.8 Flash only when claim rules conflict, behind a strict 0.72 composite confidence gate.
graph: [Contract reader, Claim extractor, Code overlap, Auditor agent, Gate ≥ 0.72, Appeal drafter, Human review]
invariants:
  - Zero-LLM native Python parsing maps CMS Medicare data straight to a Pydantic schema
  - Deterministic CPT/ICD overlap matching skips the LLM entirely on non-conflicting claims
  - A 0.72 composite confidence threshold blocks hallucinated appeals
  - Mandatory [DRAFT] legal boundary with verbatim CMS policy citations
link: https://github.com/Rana-Tigrina
---
A bahi-khata, the red cloth ledger, fell in during a flood. Munawwar taught me to read
it without guessing. Where two lines plainly agree, I do not think at all, I only match.
I think only where they quarrel. And if I am less than 0.72 sure, the page goes up the
rope to a human, marked DRAFT in my own hand.
