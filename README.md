# Protocomm

Bi-directional transport-agnostic JSON-based messaging.

**Status:** experimental, subject to change.

## Introduction

In software engineering communication protocols are defined as formal rules for transmitting the information. Modern systems tend to deal with application-level protocols such as HTTP which are already considered high level in the [OSI stack](https://en.wikipedia.org/wiki/OSI_model). However, in practice the need often arises for implementing even more application- or domain-specific protocols on top of the existing ones.

One widely known example would be a typical RESTful API which is in fact a protocol between the application server providing the functionality and the frontend application using such functionality.

Protocols aren't cheap. Good protocols try to address a lot of concerns and have to deal with a fair amounts of trade-offs. This drives a lot of initiatives to further standardize the application protocols written on top of other application protocols (e.g. Swagger/OpenAPI, JSON-RPC, gRPC-over-HTTP, etc). Such initiatives oftentimes have different goals, limitations and implications.

This library is one such initiative with following key considerations:

- It is designed for modern web applications written in TypeScript.
- Such applications may consist of many different components "talking" to each other.
- Such components may or may not exist in the same runtime/process/node. They may or may not have networking layer to communicate over.
- Some example of communications:
    - frontend application talking to a backend via HTTP (i.e. your typical webapp)
    - frontend application sending requests to a backend via WebSocket and receiving the responses and events asynchronously
    - a web page sending and receiving messages to/from the isolated iframe
    - multiple processes communicating with each other using IPC
    - two different systems talking to each other via TCP
- Protocols need to be transport-agnostic. The transport is abstracted as a readable/writeable streams. Protocomm will take care of serializing and deserializing the payloads.
- Protocols should be fully typesafe on both sides of the communication. We rely on TypeScript to provide both Client and Handler with compile-time type safety guarantees.
- Protocol messages and payload need to be validated in runtime. Runtime validation should fully correspond to compile-time validation.
- Protocol messages should have a reasonable strategy for dealing with protocol evolution.
- It should be possible to generate the documentation from the protocol definitions.

Protocomm is loosely based on [JSON-RPC](https://en.wikipedia.org/wiki/JSON-RPC) and is inspired by [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) and [Protobuf](https://developers.google.com/protocol-buffers).

## Concepts

- Communication always happen between a **Client** and a **Handler**.

    Their roles in a particular communication are not equal: client is always an initiator, and the handler is typically expected to handle multiple clients (although this is not enforced in any way).

- **Protocol** is an interface that both Client and Handler need to adhere to. It consists of one or more **domains**.

- **Domain** is an interface that defines **methods** and **events**.

- Each domain needs a corresponding **Domain Definition** — a static JSON object with metadata available in runtime. It describes the schema of methods and events and is used to automatically generate the client, validate the payloads, as well as for other meta purposes (such as documentation).

- **Protocol Index** is a collection of Domain Definition objects, corresponding to a particular protocol.

A protocol is typically implemented as a standalone isomorphic package shared between both parties and contains type definitions, schema and domain definitions of all entities and DTOs used in communication. Such package is then used on the "backend" side to implement the necessary functionality and on the "consumer" side to generate the client.

## Usage

Please refer to the [tests setup](src/test) for an example of fictional service. More examples are under construction.
