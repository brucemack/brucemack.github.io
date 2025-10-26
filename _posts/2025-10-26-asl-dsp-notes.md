---
title: Notes on AllStarLink DSP in chan_simpleusb.c
---

# Upsampling (Interpolation) High-Pass Filter

(See [chan_simpleusb.c code](https://github.com/AllStarLink/app_rpt/blob/f8e4aee84bfeeb4c3acf3ccd2c1a0cdefaef1936/channels/chan_simpleusb.c#L2130)).

The USB audio devices are running at 48 kHz. The network audio runs at 8 kHz.
Network audio needs to be upsampled by a factor of 6. As per normal 
multi-rate technique, a low-pass filter needs to be applied after the 
8kHz sample has been copied 6 times. An FIR filter is used. The comment
says: "2900 Hz passband with 0.5 db ripple, 6300 Hz stopband at 60db."
The coefficients from the actual code are here:

```c
#define	NTAPS 31
static short h[NTAPS] = { 103, 136, 148, 74, -113, -395, -694,
        -881, -801, -331, 573, 1836, 3265, 4589, 5525, 5864, 5525,
        4589, 3265, 1836, 573, -331, -801, -881, -694, -395, -113,
        74, 148, 136, 103 };
```

After some experimentation, I can match these coefficients very closely
by assuming a 31-tap FIR filter with a cut-off of 4,300 Hz and a Kaiser
window with a beta of 3.0. Here are the plots of the two impulse responses
superimposed:

![LPF Analysis](/assets/images/asl-lpf-1.jpg)

Fixed-point math is used to apply this filters. Input audio is 16-bit (signed)
PCM and the coefficients are 16-bit signed values.  After the convolution 
of the PCM audio and the taps is completed a final >>15 operation is performed
to keep the scaling right.

# Downsampling (Decimation) Low-Pass Filter

It's the opposite of above. All of the ASL processing happens at 8kHz but the 
USB sound hardware is configured for 48kHz. So we need to decimate down 
the input audio.

This process appears to use exactly the same LPF design as the upsampling filter.
This filter is applied to the 48kHz input audio.

# CTCSS Elimination High-Pass Filter

This appears in hpass6() and is selectively enabled. The goal is to strip 
the sub-audible CTCSS tone from the audio input.  From the comment in the
code this is an "IIR 6 pole High pass filter, 300 Hz corner with 0.5 db ripple."

Taking the coefficients from the code and putting them into the customary 
Direct Form I ("b/a") used for IIR filters gives this:

```
b = [0.5727761454663172, -3.4366568727979034, 8.591642181994757, -11.455522909326344, 8.591642181994757, -3.4366568727979034, 0.5727761454663172 ]
a = [1.0, -4.86645111, 9.98966956, -11.06859818, 6.99051266, -2.39325566, 0.34918616 ]
```

* Note the "gain" variable in the code that was used to adjust the b coefficients.
* Watch out for the sign convention on the a coefficients. The coefficients shown
above are the negatives of what is actually in the code to adhere to the standard form.

These parameters match almost exactly with what comes out when we synthesize a 
6th order Chebyshev filter using the scipy.signal.cheby1() function using fc=300 Hz and rp=0.5 dB.
The frequency response curves of the filter with the coefficients from chan_simpleusb.c
and the filter synthesized by SciPy are plotted below. The plots overlap perfectly:

![HPF Analysis](/assets/images/asl-hpf-1.jpg)
