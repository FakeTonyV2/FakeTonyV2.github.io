---
title: Heterogeneous LLM Inference
summary: Exploring when CPUs, GPUs, and NPUs can make language-model inference faster together.
status: In progress · ML@Purdue
featured: true
tags: [ML infrastructure, Heterogeneous compute, Speculative decoding]
---

## When does another accelerator actually help?

Language-model inference is a sequential workload. Adding more compute does not automatically make it faster: devices have to communicate, agree on work, and spend enough time doing something useful to justify that overhead.

I’m leading Heterogeneous LLM Inference at ML@Purdue, investigating how CPUs, GPUs, and NPUs can cooperate during inference.

## Starting with speculative decoding

Our initial focus is speculative decoding: a smaller model on an NPU or another accelerator drafts candidate tokens while a larger model on a GPU verifies them.

The interesting question is not just whether the smaller model runs quickly. It is whether the complete system benefits once communication, synchronization, scheduling, acceptance rates, and memory behavior enter the picture.

## What we’re investigating

- How drafting and verification should be scheduled across different devices.
- Where communication and synchronization consume the time saved by parallel work.
- How accelerator utilization relates to end-to-end latency.
- Whether an NPU can contribute useful work without becoming part of the critical path.

This is an ongoing investigation. The goal is to understand the conditions under which heterogeneous inference is useful, and the runtime abstractions that would make it practical.

<!-- Authoring TODO: Add a verified public repository and measured results when available. -->
