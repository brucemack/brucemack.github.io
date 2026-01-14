---
title: Notes on Audio Latency, Jitter, and Related Topics
---

## Decomposition of Audio Latency

David NR96 came up with a good break-down of the potential latencies in the system:

1. Audio interface input: 20mS frame rate results in a fixed 20mS delay before analog audio actually makes it into a digital frame.
2. OS/audio driver: Ideally there would be no OS involvement / added delays / buffering of audio data, and the app could receive an interrupt (or eg. message in a message queue that it blocks on) exactly every 20mS. But from I have seen of Linux audio, there is likely some strange stuff happening there and an app may not be able to just immediately get the data as it actually comes in.
3. Application: No buffering is needed in the outgoing direction, thus ideally the app should be able to immediately process incoming frames and immediately send them out over IAX. But reality may differ from what seems like common sense to me. _(Note from Bruce: Ampersand 
will send out an IAX packet immediately after a full frame is captured off the ALSA/USB
driver. There is no queuing.)_

Ideally all the above should result in no more than 20mS latency (+ maybe 0.1mS to handle the interrupt and queue the packet for LAN Tx).

4. Internet:  From my experience this typically adds 20 - 100 mS latency within the US.
5. Remote OS/LAN interface driver: Ideally IAX packets should get to the remote app right away (ie. in < 1mS) eg. through an interrupt/message queue, but that may not be a valid assumption.
6. Remote app:  The app then does "jitter" buffering -- which is not really the most accurate term, as jitter typically refers more to variation of clock pulse timing -- not much larger time scales and delayed packets that may be 100's of mS late. But that's typical of IT/telecom terminology, to 'extend' terms to mean other things. A more accurate term might be packet buffering or stream reconstruction.

(6.5, added by Bruce) A fixed 3.75ms delay per the G.711 Appendix 1 specification (section 1.2.1). This fixed delay (which is beyond the jitter buffer delay) is used to allow the PLC mechanism to "smooth" the transition between the last good audio frame and the interpolated frame in the case where a frame is still missing when its slot in the jitter buffer expires. 

7. Then the app will queue the audio to the OS/audio driver/interface, with who knows what possible latencies.
8. Audio interface output: 20mS frame rate results in another fixed 20mS delay before the original analog audio is sent out the interface to a radio or speaker.

## Asterisk Jitter Buffer

Asterisk is using a jitter buffer on the receive end of the call. See
jitterbuffer=yes in the \[general\] part of iax.conf.

Asterisk's jitter management is looking at the timestamps in the voice 
packets. See [this section in the Asterisk docs](https://docs.asterisk.org/Configuration/Channel-Drivers/Inter-Asterisk-eXchange-protocol-version-2-IAX2/IAX2-Jitterbuffer/#testing-and-monitoring): "Bad timestamps: If whatever is generating timestamps to be sent to you generates nonsensical timestamps, it can confuse the jitterbuffer. In particular, discontinuities in timestamps will really upset it".

A [GitHub PR related to jitter](https://github.com/AllStarLink/app_rpt/pull/775) that is enlightening.

## Other

[RFC 3551](https://datatracker.ietf.org/doc/html/rfc3551) uses the term "talkspurt"
to refer to a period of audio activity.

This RFC also talks about "playout delay," which is closely related to jitter buffering
and possibly adaptive jitter management.

* Relevant paper: https://www.etsi.org/deliver/etsi_es/202700_202799/202737/01.03.02_60/es_202737v010302p.pdf
* Test signals: https://www.itu.int/rec/T-REC-P.501
* Test standards: https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-P.501-199608-S!!PDF-E&type=items

PLC Stuff
* https://www.isca-archive.org/interspeech_2022/liu22s_interspeech.pdf


