---
title: Autonomous Deep Research Engine with MCP
kind: Agentic information retrieval
object: A postman's canvas bag
image: /art/bag.webp
metric: "100%"
metricLabel: Attributed ground truth
stack: [LangGraph, Model Context Protocol, Tavily, FastAPI, Python]
summary: A stateful LangGraph DAG wired to modular Model Context Protocol client-server tools, with a cyclic reflection critic loop that enforces factual groundedness.
graph: [Question, Planner, MCP tools, Evidence, Critic, Synthesis]
invariants:
  - Every claim in the output carries the source it came from
  - A critic loop sends weak answers back for more evidence before synthesis
  - Tools are modular MCP servers, added or swapped without touching the graph
link: https://github.com/Rana-Tigrina
---
A postman's bag, still buckled. Every letter in it has a stamp that says where it came
from. Munawwar said: answer like that. Go and fetch, come back, and then let a second
voice in your head ask, are you sure? If the second voice is not satisfied, go and fetch
again.
