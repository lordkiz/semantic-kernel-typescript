---
sidebar_position: 2
---

# Semantic Kernel Components

Semantic Kernel consists of modular components that work independently or together to power AI-driven workflows. This guide covers the primary components and how they interact within the kernel.

## AI Service Connectors

Provide an abstraction layer over various AI services (e.g., Chat Completion, Text Generation, Image/Audio conversions), so you can switch between providers seamlessly.

## Functions and Plugins

Plugins are containers of one or more functions, which:

- Can be advertised to AI models for function calling.

- Can be invoked inside prompt templates.

## Prompt Templates

These are flexible templates combining fixed instructions, user inputs, and plugin calls.

**Their use cases include:**

- Kickstarting a Chat Completion interaction by rendering and invoking the model.

- Function-like usage when registered as a plugin.

**A typical Workflow might look like:**

1. Render the template

2. Execute hardcoded plugin calls

3. Run the Chat Completion model on the rendered result

4. Return AI-generated result to the caller
