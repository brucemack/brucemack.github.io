
A good reference: https://vocal.com/voip/jitter-buffer-for-voice-over-ip/

* ALSA PCM timestamp stuff: https://docs.kernel.org/sound/designs/timestamping.html

Asterisk is using a jitter buffer on the receive end of the call. See
jitterbuffer=yes in the \[general\] part of iax.conf.

Asterisk's jitter management is looking at the timestamps in the voice 
packets. See [this section in the Asterisk docs](https://docs.asterisk.org/Configuration/Channel-Drivers/Inter-Asterisk-eXchange-protocol-version-2-IAX2/IAX2-Jitterbuffer/#testing-and-monitoring): "Bad timestamps: If whatever is generating timestamps to be sent to you generates nonsensical timestamps, it can confuse the jitterbuffer. In particular, discontinuities in timestamps will really upset it".





