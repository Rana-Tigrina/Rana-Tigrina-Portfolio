---
title: Clinical Diarization & SOAP Synthesis
kind: Acoustic NLP
object: A doctor's stethoscope
image: /art/stethoscope.webp
metric: "65%"
metricLabel: Physician time saved
stack: [WhisperX, Gemma 4, Qwen 3.5, Librosa, Docker]
summary: An acoustic consultation pipeline. Phoneme-aligned WhisperX diarization separates clinician from patient, Gemma 4 writes the SOAP note, and Qwen 3.5 validates it clinically.
graph: [Consultation audio, WhisperX diarization, Clinician / patient, Gemma 4 SOAP, Qwen 3.5 check, Note]
invariants:
  - Speaker separation happens before any language model sees the text
  - A second model checks the note against the transcript
link: https://github.com/Rana-Tigrina
---
A stethoscope. Two voices come down the tube, the healer's and the sick one's, and I
have learned to tell them apart by the sound alone. I write down what was said, in the
order a healer wants it. Then a second frog reads it over. There is no second frog. You
understand what I mean.
