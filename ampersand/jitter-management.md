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

# References

* [A paper that talks about skew (clock speed differences)](https://csperkins.org/publications/2000/07/icme2000/icme2000.pdf) from University College, London.
* [A paper: "Assessing the quality of VoIP transmission affected by playout buffer scheme"](https://arrow.tudublin.ie/cgi/viewcontent.cgi?article=1037&context=commcon)
* Paper: https://web.stanford.edu/~bgirod/pdfs/LiangMM2003.pdf
* A [good/detailed reference paper](https://vocal.com/voip/jitter-buffer-for-voice-over-ip/) written 
by VoCAL, a professional services firm in the VOIP space.
* Mentioned in the VOCAL reference: "The key element is the PWSOLA box (Packet-based Waveform Similarity Overlap-Add) which controls the adaptive buffer operation."
* ALSA PCM timestamp stuff: https://docs.kernel.org/sound/designs/timestamping.html
* A journal article about statistical management of jitter: https://www.embedded.com/reducing-voip-quality-degradation-when-network-conditions-are-unstable/






