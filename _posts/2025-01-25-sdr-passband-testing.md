---
layout: post
title:  "SDR2 Project - Passband Testing"
tag-name: sdr2
categories: [ "SDR" ]
---

I've been working on a SDR project for a few months now.  Things are 
finally starting to work.  The receiver sounds pretty good, but there are many 
parameters in the design that have been chosen somewhat arbitrarily. Therefore,
I've been trying to do some systematic testing to figure out what is optimal.
Some of these things may be too subtle to judge by ear.

# Test 1: Experimenting With Hilbert Group Delay Assumption

The receiver uses the classic quadrature mixer method to produce base-band
I/Q signals.  A Hilbert transform is implemented on the Q channel to 
provide the 90° phase shift that is used to achieve opposite 
sideband suppression. In order for this to work correctly we need to make
sure that the _I channel is delayed by the same amount as the Q channel_. In other 
words, the I channel needs to be artificially delayed by the group delay 
of the Hilbert transformer that exists on the Q channel.

*The accuracy of this I/Q synchronization is critical to the quality of the opposite 
sideband suppression provided by the Hilbert transformer.*

Per the DSP reference (see Lyons 1st ed. pg. 202), the group delay of a 
linear phase FIR filter with S taps (an odd number) is:

G<sub>odd</sub> = ((S - 1) t<sub>s</sub>) / 2

Where G<sub>odd</sub> is the delay and t<sub>s</sub> is the sample interval, both in seconds.
That's the number that was originally coded into my firmware.

I've read some articles that suggest that "tuning" this delay a tap
or two can help to compensate for imperfections in the hardware implementation
and may result in improved sideband suppression performance. The purpose of this 
experiment is to evaluate this parameter.

### Test Setup

One of the great things about SDR rigs is that systematic performance testing can 
often be achieved without much additional hardware. This test is an example.

I'd like to plot the audio passband of my SDR rig _on both sides of zero-beat_ to
understand (a) the shape of the audio passband and (b) the quality of the suppression 
of signals on the "other side of zero."  

The intuitive way to perform this test is to tune the rig's VFO to a fixed frequency and 
sweep an RF signal across both sidebands around the center VFO. Ideally the amplitude
of the resulting demodulated audio would be (a) flat across the desired sideband and (b)
zero across the opposite sideband.

To make this test easier I've changed things a bit. Instead of sweeping a test signal 
across the passband, I play a _fixed carrier_ into the antenna port and sweep the rig's 
VFO backwards through the same range, measuring the audio power (actually V<sub>rms</sub>)
at each point. When the VFO is below the test
carrier the upper sideband response is tested and when the VFO is above the test carrier the 
lower sideband response is tested.

Since I'll be running this test a lot I've added a feature to the rig's firmware that 
performs this sweep/measurement sequence quickly. The test spends 100ms at each frequency
of the sweep in 100 Hz increments. The audio power is observed at each frequency and can be dumped 
out and plotted for analysis. 

Test particulars:
* Fixed carrier at 7,200 kHz.
* Sweep VFO from 7,195 kHz to 7,205 kHz in 100 Hz steps.  
* 100ms at each location.
* Audio power was measured across 256 samples taken at 8 kHz.
* My Hilbert transform was using 51 taps. 
* I generated the Hilbert impulse response
using [my implementation of the Parks-McClellan algorithm](https://github.com/brucemack/firpm-py). 
* There is also a 91-tap low-pass filter with a cutoff of 3.5 kHz.

I ran four 
tests with four different "tweaks" to the group delay of the Hilbert transformer. It 
turns out this delay makes a difference.

![Link 1](/assets/images/passband-0.png)

The positive frequencies on the right side of the x-axis represent the desired sideband and the 
negative frequencies on the left represent the opposite sideband.  

Notice a few things:
* First off, the shape of the desired passband is pretty good. The "lows"
are rolled off a bit much (below 500 Hz), but this is a known behavior of the Hilbert 
transformer filter. More on this later: it would be nice to improve this, possibly
with more Hilbert taps.
* The passband rolls off pretty sharply starting at +3.5 kHz. This makes sense
since my rig has a 91-tap low-pass filter with this transition frequency.
* There are ripples in the passband and stopband, as expected.

Focusing on the unwanted sideband, the red plot (+0) is the baseline delay assumption 
documented above. Opposite sideband
suppression is not great at around -2.1 kHz, only -10dB. Notice that shortening the 
delay by one tap (blue trace) gets even worse, and increasing the delay by one tap (yellow
trace) gets a bit better. Increasing the delay of the I channel by 2 taps gives the best
result (green trace) with around -25dB of opposite sideband suppression across the entire
audio passband. That should be good enough for my purposes.



