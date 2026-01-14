---
title: Ampersand Linking Project
---

The purposes of this project:
* To provide hams with a simple way to link radios to 
the [AllStarLink](https://www.allstarlink.org) network. Radio-less applications are also supported (conference
hubs, direct audio connections, etc.). 
* To provide a platform for research and experimentation to advance the state-of-the-art
around ham radio linking.
* To maintain compatibility with the rest of the ASL ecosystem. This **is not** a fork
of ASL or an attempt to create a parallel network.

This project was originated in October of 2025 by [Bruce MacKinnon (KC1FSZ)](https://www.qrz.com/db/KC1FSZ)
of the [Wellesley Amateur Radio Society](https://ema.arrl.org/wellesley-amateur-radio-society/) in Wellesley, MA. Please reach out using the e-mail address provided in QRZ. You can try me on AllStar 
node 672730, as long as I'm not in the middle of a compile. [I'm also on LinkedIn](https://www.linkedin.com/in/bruce-mackinnon-7256314/).

The [GitHub project is here](https://github.com/Ampersand-ASL).

* (Will be replaced with table of contents)
{:toc}

# Introduction

There are well established ways to get on AllStarLink using the [ASL3](https://allstarlink.github.io/) package and
the [Asterisk](https://www.asterisk.org/) open-source PBX. Asterisk is a sophisticated system intended
for a broad set of telephony applications. As such, it can be hard to understand, hard to configure, and hard to enhance. The Ampersand project is 
focused on supporting a **minimal set of capabilities needed by hams.**

The Ampersand project is not attempting to replace Asterisk. There are 1000's of 
successful Asterisk installations being used by hams and that isn't expected to change.
My hope is that Ampersand will provide a better platform for experimental work.

# Users/Installation

Please see [The Ampersand Server User's Guide](https://github.com/Ampersand-ASL/amp-server/blob/main/docs/user.md) for installation instructions.

# Software

The source code for the system is developed in [this set of Github repos](https://github.com/Ampersand-ASL). The main branch is production/stable. Development activity is 
integrated on the develop branch.

I accept PRs to the develop branch.

## Software License

Ampersand is released under the [GNU Public License](https://www.gnu.org/licenses/gpl-3.0.en.html). 

## A Few Notes on Project Software Philosophy

This is a C++ project. However, you'll note that there are no deep/complex
inheritance hierarchies. Also, the use of templates/meta-programming is kept 
to a minimum. Abstract interfaces ([GoF Facade Pattern](https://en.wikipedia.org/wiki/Facade_pattern)) are used as much as possible.

Linkages between the major components is kept as loose as possible. This is particularly
relevant in an application like this that deals heavily with networking. Most 
of the interaction between major components of the AMP Server are achieved through 
an asynchronous Message-passing interface.

The use of multi-threading is kept to an absolute minimum. There are two reasons for
this. First, I want to be able to run large parts of this code (not 100%) on 
bare-metal micro-controllers that 
lack a thread primitive. But more importantly, **I have spent too many years of my
life debugging complex (and often non-reproducible) bugs related to concurrency errors.** 
The best advice I've seen to improve the reliability of multi-threaded architectures
is: **just don't do it!** 

Being reasonable, there are some places where threads
are unavoidable, or at least the work-around is very difficult. In this system, 
**the only interaction between threads should be via Message-passing through a 
thread-safe queue.** Anything else is asking for problems that I don't want to 
spend time debugging. Given this philosophy, there should be no mutexes or other 
synchronization objects in the code.

The code below provide a good example of my general concern:

![MT Error](assets/mt-error.jpg)

Notice a few things:
* There are some things in this function that need to happen under
lock and some things that don't. All developers need to be on the 
same page, which can be hard in a distributed/open-source team. One missed 
lock and you might have a strange bug.
* Certain locks cover certain resources. Depending on how many 
shared resources there are this could be very complicated to keep track of.
* It's very easy to create a situation like the one shown on line 2054 
of this function. Notice that a lock is acquired at line 2039 but the 
function **possibly** returns at line 2054 without releasing the lock. 
Is this a bug? 

**NOTE:** I'm not being critical of app_rpt or chan_simpleusb here, this is just the first 
file that came up when I started searching for calls to the lock/unlock functions.

On a similar note, the use of dynamic memory allocation is kept to a minimum.
First, I want to be able to run this code on bare-metal micro-controllers that 
lack dynamic memory. But more importantly, **I have spent too many years of my
life debugging complex (and often non-reproducible) bugs related to 
memory errors.** 

There are certain parts of the system that do not run on the microcontroller
platform and those parts will use things like std::string, std::vector, that
use dynamic memory internally. But much of the core system does everything 
on the stack.

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

Strictly speaking, the Asterisk PBX server is _just one 
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
inherited from the Asterisk architecture somewhere, although I doubt it because the Asterisk PBX has 
some 16K CODECs. 

The Ampersand system avoids this limitation. The system supports a 16K audio mode that we're 
calling "ASL-HD." This may not be relevant for links between typical analog repeaters that 
operate with narrow
audio bandwidths, but "pure digital" links (i.e. desktop-to-desktop) sound much better in 16K.

Since the Ampersand audio core runs at 48K, a decimation/interpolation low-pass filter is needed during the 
down/up sampling process. I've used a 45-tap FIR filter designed using [the Parks-McClellan algorithm](https://github.com/brucemack/firpm-py).

The ideal cut-off frequency of this filter should be at 8kHz, but there is a transition band. I've 
started the transition at 7kHz. Here's the transfer function of the filter used in the system:

![16K LPF](assets/hd-lpf.jpg){: width="400" }

This looks decently flat in the passband, rolls off steeply, and attenuates anything that could create aliases.

Ampersand's 16K CODEC is just 16-bit linear PCM represented in little-endian format. According to the official 
[IANA Registry for IAX](https://www.iana.org/assignments/iax-parameters/iax-parameters.xhtml) there
is no CODEC media code allocated for 16K PCM. However, the Wireshark dissector for IAX2 lists CODEC
code 0x00008000 as 16K linear PCM. Since the IANA registry doesn't provide an assignment for this 
particular code (i.e. it's "open") I'm assuming that's the right one to use. (I'll put that 
on the list of things to ask IANA to update in their documentation.)

Ampersand will favor 16K linear PCM whenever possible, falling back to G.711 uLaw (8K) as needed.

## Jitter Buffer

The "jitter buffer" is the subject of a lot of discussion on the AllStarLink board over the 
years. After studying this quite a bit, I can now appreciate the challenge of making this 
work efficiently. I’ve been focused on adaptive algorithms that do a good job of keeping the 
latency through the system as short as possible. The method I’ve settled on at the moment is 
called "Ramjee Algorithm 1" after a paper by Ramjee, Kurose, Towsley, and Schulzrinne called 
"Adaptive Playout Mechanisms for Packetized Audio Applications in Wide-Area Networks". Unfortunately, 
the paper is behind an IEEE paywall so I can’t link to a copy of it. This algorithm estimates 
the variance of the flight times of the voice packets and dynamically adjusts the size of the 
jitter buffer to be larger for very jittery transmissions and smaller for less jittery ones. It 
works pretty well at keeping the delay as short as possible. 

Simple adaptive jitter buffer algorithms wait until the end of a transmission before making an 
adjustment to the delay. That’s usually OK, but there are times when the variance is spiking up and 
the adaptive algorithm would really like to extend the delay a bit to increase margin and avoid 
voice packet loss. Fancy VoIP systems have the ability to “slow down” a few frames of audio 
mid-stream to allow the delay to be extended without creating an audible gap in the conversation. This 
is closely related to PLC - more below.

It’s hard to tell exactly how the jitter buffer inside of Asterisk works, but I don’t think it’s using any very advanced adaptive algorithms.

### Notes on EchoLink

I asked Jonathan K1RFD, the author of EchoLink, what his software does. Here's a 
section of his reply:

> Bruce,
> 
> I don't recall all of the details, but here's what I do remember:
> 
> The app looks at the sequence number of packets and is on the lookout for any gaps in the 
> numbering, or out-of-sequence packets.
>
> If packets which are still in the buffer are out of sequence, they are re-arranged so as to be 
> properly consecutive.
>
> If a gap in the numbering is detected, and the buffer is nearly empty, a packet of silence is 
> inserted to take the place of the missing packet.
> 
> One thing to be on the lookout for is non-consecutive numbering coming from conference servers. Some 
> conference servers might pass along the original sequence numbers from each participant, rather than
> generating their own new ones, and if so, this will create a big discontinuity in between 
> transmissions. But, by that time, the buffer is probably already empty due to the pause between
> transmissions.

### References

* [A paper that talks about skew (clock speed differences)](https://csperkins.org/publications/2000/07/icme2000/icme2000.pdf) from University College, London.
* [A paper: "Assessing the quality of VoIP transmission affected by playout buffer scheme"](https://arrow.tudublin.ie/cgi/viewcontent.cgi?article=1037&context=commcon)
* Paper: https://web.stanford.edu/~bgirod/pdfs/LiangMM2003.pdf
* A [good/detailed reference paper](https://vocal.com/voip/jitter-buffer-for-voice-over-ip/) written 
by VoCAL, a professional services firm in the VOIP space.
* Mentioned in the VOCAL reference: "The key element is the PWSOLA box (Packet-based Waveform Similarity Overlap-Add) which controls the adaptive buffer operation."
* [ALSA PCM timestamp stuff](https://docs.kernel.org/sound/designs/timestamping.html)
* [A journal article about statistical management of jitter](https://www.embedded.com/reducing-voip-quality-degradation-when-network-conditions-are-unstable/)

## Packet Loss Concealment (PLC)

Packet Loss Concealment (PLC) algorithms are one of the tricky parts of this system. PLC is the thing that fills gaps in a transmission that result from lost or, more commonly, very late voice packets. There are a lot of research papers on this topic. At the moment Ampersand is using something called “ITU G.711 Appendix I” which is a pretty standard/simple method. From looking at the waveforms that come out of Asterisk during packet loss, I am pretty sure it uses something very similar.

It’s confusing because G.711 usually refers to the uLaw/ALaw CODECs, but G.711 Appendix I has nothing to do with these CODECs. This PLC method could be used for any CODEC. [The paper is in the public domain](https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-G.711-199909-I!AppI!PDF-E&type=items).

The idea is to estimate the “pitch” of a short recent sample of the transmission and then generate a synthetic sound (more than just a tone) that matches that pitch during any gaps in the transmission. The
G.711 algorithm "searches" for the best pitch by correlating recent history of the audio with a range 
of time-lagged versions of itself. Interestingly, the search range is limited to 66.66 Hz to 200 Hz, 
so the pitch estimation that comes out of this process is fairly low.

There are a bunch of features in this spectral interpolation algorithm that try to smooth the transitions between real speech and synthetic speech to avoid discontinuities. The result is surprisingly effective as long as the gap is small <= 60ms. And it runs well on a small microcontroller. Unsurprisingly, a lot of the cutting edge work in this space is focused on AI-driven models that predict longer passages of missing audio. It won’t be long before it can finish our sentences ...

The implementation of the G.711 approach can be found [in this Github repo](https://github.com/brucemack/itu-g711-codec).

# Other Pages

* [ASL DSP Notes](asl-dsp-notes)
* [55553 Parrot](parrot-55553-notes)
* [Notes on Audio Latency, Jitter, and Related Topics](jitter-management.md)
