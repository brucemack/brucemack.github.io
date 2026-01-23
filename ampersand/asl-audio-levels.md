---
title: Notes on Receive Audio Level Calibration 
---

The ASL system provides a tuning utility that helps you to adjust the input (receive)
audio level that is being passed into the ASL network from your station. This adjustment 
relates to the receiver audio output for a radio-connected system or the microphone 
gain for a radio-less system. The setting of the CM1xx microphone mixer also effects 
this level. Obviously, getting the audio input level right is important to those who are listening to you across the network.

The `app_rpt` tuning utility displays a real-time audio level meter to help you make
these adjustments. Given the heritage of the ASL system and its creators, it's 
not surprising that this meter displays audio levels in units of deviation. In fact, almost
all of the [audio setup documentation for the ASL system](https://allstarlink.github.io/adv-topics/audio-level/) is written from the perspective of deviation levels for 
an FM modulator. Moreover, the setup documentation assumes that you have access 
to a nice RF service monitor
like the [HP/Agilent 8921A](https://www.testwall.com/media/catalog/product/file/HP_83205A-97483.pdf). You can get a refurbished one (calibrated) for around $5,000,
so that's no problem. :-)

The [guidance for setting up the receive audio level](https://allstarlink.github.io/adv-topics/usbinterfaces/#setting-audio-levels) asks you to:

> Talk at a normal and steady volume into the microphone and be sure that the 
> average level does not go past the "3KHz" point, and that peak levels do 
> not go significantly past the "5KHz" point.

Meanwhile, the other method that seems to be widely used - particularly for those
few hams who might not own a service monitor - is to call one of the 
parrot stations on the network. [Texas 55553](https://mackinnon.info/ampersand/parrot-55553-notes) or [UK 40894](https://hubnetwork.uk/parrot/) is an example of good one. However, these parrots aren't calibrated  
in terms of FM deviation units. Instead, they provide a subjective assessment
of audio level with phrases like "pretty good" (TX 55553) or "your audio is perfect" (UK 40894). In the case of the UK parrot there is a web-based level meter that
provides a slightly more scientific display - more below.

So what does all of this translate to in terms of the actual bits being transmitted on 
the ASL network? What we need to figure out is how these various tools work in terms 
of conventional digital audio level units of dBFS (full-scale).

## app_rpt Tune Display

I've been looking at the `app_rpt` code to try to figure out what "5kHz point" really 
means in terms of the IAX2 voice data flowing onto the network. You can figure this out by counting spaces.

The meter is driven by a peak amplitude `apeak` which is compted (`chan_simpleusb.c`) 
from the minimum `amin` 
and maximum `amax` 16-bit signed PCM values seen in each sample window:

    apeak = (amax - amin) / 2

So the `apeak` value for a "full swing" audio sample (i.e. maximum possible deviation) would be
32767.

Since the meter is displayed using ASCII art, the `apeak` value needs to be converted to 
a set of = characters that display a bar across the typical 80 column text terminal.
This happens in the `tune_rxdisplay()` function:

    meas = apeak
    ncols = 75
    thresh = (meas * ncols) / 16384;

This implies that a full swing signal would require about 150 columns of text. Doing the 
math the other way:

    meas = thresh * 16384 / ncols 

Working backwards to understand what 5kHz deviation means is tricky because the math 
isn't explicitly stated in the code. It requires counting the columns in these lines:

    ast_cli(fd, "RX VOICE DISPLAY:\n");
    ast_cli(fd, "                                 v -- 3KHz        v -- 5KHz\n");

I count 34 spaces to get to the 3kHz point and 51 to get to the 5kHz point. Let's just hope the user has a monospaced font! HIHI. 

Using the ratio above, 3kHz corresponds to an `apeak` of 7,430 and 5kHz corresponds to 11,100. In dBFS
terms this means that 3kHz is -12 dBFS peak and 5kHz is -9 dBFS peak. (NOTE: This 
squares with the advice that career TV broadcast engineer Dan Brown W1DAN once gave me: "always leave at least 10dB of headroom.")

## TX 55553 Parrot

Patrick N2DYI has given me a lot of useful information about the way his parrot works
and how levels should be computed in general. I've done a [separate article on the details](https://mackinnon.info/ampersand/parrot-55553-notes). Bottom line: Patrick 
does his work using RMS (average) levels, *not peak levels.* His mapping is as follows:

| RMS dBFS    | Qualitative         |
|-------------|---------------------|
| <= -60      | Can't be heard      | 
| -59 to -40  | Very low            |
| -39 and -31 | Low                 |
| -30 to -23  | Average             | 
| -22 to -20  | Above average       |
| -19 to -17  | Critically high     |
| >= -16      | Ridiculously high   |

This also squares since the crest factor for typical speech is around 14dB.
So the 55553 parrot's -30dB to -23dB "Average" range roughly corresponds to peak 
levels of approximately -16dBFS to -9dBFS peak. Not too far from the -12dBFS
to -9dBFS range targeted by the `app_rpt` tuning meter.

## UK 40894 Parrot 

I don't have any contact at the HUBNet parrot node but I can do an empirical experiment.
I dialed the UK parrot and injected a continuous -10dBFS tone (0.31 * 32767 peak amplitude) into 
the network. The parrot reported that my audio was "very loud" and the display 
meter on the playback website registered a steady -10. So **that scale is calibrated
in peak dBFS.**

The web interface instructs the user to _"Keep your audio in the amber range"_ which
extends from -15dBFS to -5dBFS peak. -5dbFS seems like a high target to me (TX 
parrot tells me _"yeah ... that's just way, way, too loud."_) but at least the amber part of the scale
is centered around the -10dBFS peak level.

The web interface also displays an "RMS Level" of 6930. This checks out as well since

    20 * log10((6930/0.707) / 32767) ~= -10

## Notes From David NR9V

David NR9V builds AllStar audio interface hardware commercially and has spent a lot
of time helping people tune their stations properly. His notes on this topic are 
helpful and pretty consistent with the above.

> In any digital audio system peak levels are the primary measure of signal levels being 
> within proper range and after having put a lot of thought into this over time as far 
> as exact numbers I think the following are what should be the "canonical" definition 
> of peak audio levels for AllStar:

| Peak level (dbFS)  |  LED Color   |    Description          |
| -------------------|--------------|-------------------------|
| > 0                | Flashing Red |  Clipped, Much Too High |
| 0 to -2            | Red          |  Too High               |
| -3 to -5           | Yellow       |  Above Normal           |
| -6 to -9           | Green        |  Good                   |
| -10 to -12         | Med. Green   |  Below Normal           |
| -13 to -15         | Dark Green   |  Too Low                |

> "> 0 dBFS" i.e. clipping is indicated if >= 3 sample values in a row 
> are > ~99% full-scale.

> Average values (ie. the max average power value that occurred within any 1 second 
> window) are also important, but are somewhat secondary to peak audio levels, though 
> not entirely secondary. The difference between peak and average levels can roughly 
> be generalized as:

| Peak - Max Avg Level (dB)  |  Desc                                           |
| ---------------------------|-------------------------------------------------|
| > 20                       | Weak audio, low average-to-peak power levels    |
| 20 - 10                    | Good                                            |
| < 10                       | Overcompressed, reduced dynamics / muddy audio  |

> Weak audio typically occurs with knockoff $20 DMTF mics found on 
> Amazon/ebay/aliexpress, etc., and with homebuilt radioless nodes that have no
> mic AGC/compression/limiting. But there can be many other reasons why these 
> numbers can vary considerably.
>
> In all these measurements, I do recommend first trimming off at least the first 
> and last 1/2 second or so of audio, and, tossing any stats numbers for the first 
> and last 1 second windows if those numbers substantially differ from the middle 
> 1 second windows.
>
> The important thing in any parrot node is that it first and foremost always 
> reports the actual (dBFS) peak and max average power levels. 
