---
title: Purdue ROV Computer Vision Runtime
summary: Infrastructure for running, transporting, testing, and observing vision workloads on embedded hardware.
status: In progress · Purdue ROV
featured: true
tags: [Embedded systems, Computer vision, Runtime design]
---

## Beyond a camera and a model

A computer-vision pipeline is easy to draw: capture a frame, run a model, send the result. On a robot, that diagram leaves out the difficult parts. Cameras disappear, processes fail, network conditions change, and the hardware has a limited compute budget.

With Purdue ROV’s Computer Vision team, I’ve worked on the infrastructure that lets those workloads run, communicate, and remain observable on embedded Linux hardware.

## The runtime

The work grew into a modular runtime with independently managed camera and vision processes. ZeroMQ messaging and Protobuf define communication between components, while shared memory supports frame transport.

The surrounding infrastructure covers UVC/V4L2 camera capture, persistent device discovery, RTP video transport, recording and replay, health monitoring, simulation, and preflight validation. YAML configuration describes workloads and deployment on Raspberry Pi-class hardware.

## The interesting systems problem

The central problem is defining contracts between components: how they register, report health, restart, and recover without requiring every other process to know their internal implementation.

That also means catching problems before a workload starts. Camera-mode validation and model/deployment checks make hardware assumptions explicit rather than leaving them to fail somewhere inside the pipeline.

The project has pushed me to think about observability and recovery as part of the runtime’s design, alongside the data path itself.

<!-- Authoring TODO: Add a verified public repository and architecture/postmortem articles when written. -->
