---
title: Notes on AllStarLink Parrot Node 55553
---

I've been using the 55553 parrot node quite a bit in my 
research and development. I reached out to it's owner, Patrick Perdue 
(N2DYI) and he sent me this very informative note (below) that
gives insight into how Asterisk and parrot technology
work. He modestly claims that he's a "terrible programmer," but 
this parrot is quite clever/sophisticated and also has a good
sense of humor. It would have been impossible to get my 
IAX2 implementation working without 55553.

## Note From Patrick

Hi Bruce:

Yeah, 55553 is mine. I put it together in November of 2022, because, while there were some public parrot nodes out there, I didn't know of one that also analyzed the audio level and gave a reference recording that's at an average level to compare with. Since then, node 40894 now does something similar as of a few months ago. I use it sometimes to test trans-atlantic routes, since it's in England.

Mine is written entirely in shell script, because I am a terrible programmer, and don't really know what I'm doing. I'm an audio guy by trade. Essentially, what happens is this:

It's running on HamVoIP Asterisk (I'm sure it would run fine on ASL3, but at the time, HamVoIP Asterisk had a more stable timing source than older ASL, and I haven't really had a good reason to move it yet). It's running on a Raspberry Pi 4 model B that lives in a data center in Plano, TX, mostly for the power backup and the higher tier routes.

I have that particular node set up to archive all transmissions.
An event fires a shell script when a transmission is seen by the node, which essentially just sets a filename as a variable.
When the transmission ends, that file is sent to [SoX](https://en.wikipedia.org/wiki/SoX), which spits out an RMS level, among other things. That RMS is then converted from 32-bit float to a human readable number.

    $(echo "scale=3; (l($RMS)/l(10))*20" | bc -l)

I ignore the last 300 milliseconds of a transmission in the analysis, because loud squelch tails can often throw off the average in a way that is not meaningful, so I just ignore it while analyzing, but still allow it to play back.

Depending on what range comes up, an appropriate response is played randomly from a directory, so it's not always the same response. There is a directory structure with a folder containing responses for each target. I can't hear anything (-60 dB RMS or less), very low (between -59 and -40), low (between -39 and -31), average (-30 to -23), above average (-22 to -20), critically high (-19 and -17), and ridiculously high (-16 and above).

The response is then concatenated to the original raw g711 recording from the node, minus the first and last 1896 bytes, because I found that to just be padding, and played back through Asterisk as a single bitstream approximately 0.3 seconds after your test transmission ends.

I had it playing immediately for a while, but found that it was too fast for some nodes.

So, that's how it basically works.

At some point, I hope to add PL tone detection, where it will point out if you have an unfiltered PL coming into the system, tell you what the frequency is, and give a tip about applying a high pass filter, or something. I hear a lot of nodes transmitting PL without realizing it, and this throws off the RMS reading, since there is a constant sine wave. So, people who actually have very low voice audio will report as way too high because of the PL, and may not understand what is going on.

I could just filter everything below 300 Hz in the analysis, but that breaks things differently, so I want to just have an entirely different process for that. Haven't gotten around to it yet, though.

Re latency:

That has always been kind of a sticking point for me. With Asterisk/app_rpt, it is basically impossible to get anything less than about 220 MS round trip on the same node, even just for locally repeated audio. No network stack is even involved yet.

I can send audio through [Sonobus](https://www.sonobus.net/) to a friend in London from New York, and get it back in less time than it takes app_rpt to send back my own audio on a local node. It'd be great if we could globally reduce latency across all nodes without adversely affecting jitter and such.

Anyway, curious to know what sort of latency measurements you have gotten with your setup.

73
Patrick, N2DYI, New York, NY
