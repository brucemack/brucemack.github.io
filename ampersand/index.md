---
title: Ampersand Linking Project
---

The purpose of this project is to provide hams with a simple 
way to link radios to the [AllStarLink](https://www.allstarlink.org) network. Radio-less applications are also supported (conference
hubs, direct audio connections, etc.). 

* (Will be replaced with table of contents)
{:toc}

# Introduction

There are well established ways to get on AllStarLink using the [ASL3](https://allstarlink.github.io/) package and
the [Asterisk](https://www.asterisk.org/) open-source PBX. Asterisk is a sophisticated system intended
for a broad set of telephony applications. As such, it can be hard to understand, hard to configure, and hard to enhance. The Ampersand project is 
focused on supporting a **minimal set of capabilities needed by hams.**

# Software

# Conceptual Model of the Ampersand Server

_(Work in process, diagram needed)_

This section describes the conceptual model of the Ampersand 
Server. Ampersand enables integration with the AllStarLink network (abbreviated ASL). For the purposes of this description, 
we define ASL as the following:

* A namespace that assigns a unique identifier
for each node on the ASL network.
* A robust process for issuing node numbers that tracks
ownership, prevents 
duplicates and ensures that only licensed amateurs are allowed on the network.
* The [documented IAX2 protocol](https://datatracker.ietf.org/doc/html/rfc5456), which allows ASL servers to communicate
with each other across public/private IP networks.
* The AllStarLink registration service that provides:
  - The ability to resolve a node number to a network address
  using documented APIs and/or DNS.
  - A secure way to allow a node owner to update the network 
  address of their node using documented APIs.
* The AllStarLink monitoring service which provides:
  - The ability to view/query status information for 
  any node on the ASL network using defined APIs or
  through a sophisticated web portal.
  - The ability for nodes to periodically post their status
  using defined APIs. 
* Some "parrots," and other special-purpose nodes that 
provide the diagnostic/support capabilities necessary for a robust network.
* A [community forum](https://community.allstarlink.org/) used
to make announcements and discuss the ASL network.
* The [ability to collect donations](https://www.allstarlink.org/about/donate.php) necessary to support the infrastructure
for this large network.

Strictly speaking, the Asterisk PBX server is _one 
implementation_ of the IAX2 protocol, but it is not a 
required component of
the ASL network. Any network participant who is a licensed 
ham, [makes their donation](https://www.allstarlink.org/about/donate.php) to support the infrastructure, and follows all of the 
protocols described above can communicate.

The Ampersand **server** is a process that runs on a network-connected
computer or microcontroller. A server can host one or more **nodes**,
where the term "node" has the usual meaning on the ASL network.

Nodes are connected to one another via **links**. Nodes that 
are linked pass audio and signaling information between each
other. If multiple nodes are linked to the same node, those
nodes are all in conference with each other. With a few exceptions,
audio transmitted into a node will be received by all other 
linked nodes and vice-versa.

Two nodes hosted by the same server are not necessarily linked.

The Ampersand server hosts one or more **lines**. A line is
the medium that allows audio/signaling information to 
be passed into and out of a node. At the moment,
there are two types of lines supported by Ampersand:
* An IAX2 line, which provides the connectivity between
nodes across a network.
* A USB line, which allows a node to be connected to 
a USB interface (typically a radio or other audio device).

(Call)
(Users)
(Permanent Link)

# Technical Information

This section contains various articles on different parts of the ASL system. Some of this is 
more detail that a normal user would need, but the goal is to encourage understanding/experimentation
with the mechanics of VOIP linking system.

## Audio/DSP 

The Ampersand audio "core" runs at 48kHz. Audio is down/up-sampled when interfacing with links
that operate at lower bandwidths. 

### 16K Audio (aka "ASL-HD")

The existing app_rpt/chan_simpleusb code appears to make the fundamental assumption that network 
audio is sampled at 8kHz. The USB side of the system runs at a higher rate (48K), but the
captured stream is immediately down-converted to 8K. It's possible that this restriction is 
inherited from the Asterisk architecture somehwere, although I doubt it because the Asterisk code has 
some 16K CODECs. 

The Ampersand system avoids this limitation. The system supports a 16K audio mode that we're 
calling "ASL-HD." This may not be relevant for links between typical analog repeaters that 
operate with narrow
audio bandwidths, but "pure digital" links (i.e. desktop-to-desktop) sound much better in 16K.

Since the Ampersand audio core runs at 48K, a decimation/interpolation low-pass filter is needed during the 
down/up sampling process. I've used a 45-tap FIR filter designed using [the Parks-McClellan algorithm](https://github.com/brucemack/firpm-py).

The ideal cut-off frequency of this filter should be at 8kHz, but there is a transition band. I've 
started the transition at 7kHz. Here's the transfer function of the filter used in the system:

![16K LPF](assets/hd-lpf.jpg)

This looks decently flat in the passband, rolls off steeply, and attenuates anything that could create aliases.

Ampersand's 16K CODEC is just 16-bit linear PCM represented in little-endian format. According to the official 
[IANA Registry for IAX](https://www.iana.org/assignments/iax-parameters/iax-parameters.xhtml) there
is no CODEC media code allocated for 16K PCM. However, the Wireshark dissector for IAX2 lists CODEC
code 0x00008000 as 16K linear PCM. Since the IANA registry doesn't provide an assignment for this 
particular code (i.e. it's "open") I'm assuming that's the right one to use. (I'll put that 
on the list of things to ask IANA to update in their documentation.)

Ampersand will favor 16K linear PCM whenever possible, falling back to G.711 uLaw (8K) as needed.

# Other Pages

* [ASL DSP Notes](asl-dsp-notes)
* [55553 Parrot](parrot-55553-notes)
* [Notes on Audio Latency, Jitter, and Related Topics](jitter-management.md)
