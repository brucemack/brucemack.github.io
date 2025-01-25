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

# Experimenting With Hilbert Group Delay Assumption

The receiver uses the classic quadrature mixer method to produce base-band
I/Q signals.  A Hilbert transform is implemented on the Q channel to 
achieve a 90° phase shift that can be used to achieve opposite 
sideband suppression. In order for this to work correctly we need to make
sure that the I channel is delayed by the same as the Q channel. In other 
words, the I channel should be artificially delayed by the group delay 
of the Hilbert transformer that exists on the Q channel.

Per the DSP reference (see Lyons 1st ed pg 202), the group delay of a 
linear phase FIR filter with S taps (an odd number) is:

G~odd~ = ((S - 1) t~s~) / 2


![Link 1](/assets/images/passband-0.png)
