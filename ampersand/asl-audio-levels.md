---
title: Notes on Receive Audio Level Calibration 
---

This article is all about understanding the magnitude of the digital 
voice samples that 
an AllStar node sends to the network. These are not suggestions
on how to tune your station.

The ASL system provides a tuning utility that helps you to adjust the input (receive)
audio level that is being passed into the network from your station. This adjustment 
pertains to the receiver audio output for a radio-connected system or the microphone 
gain for a radio-less system. The setting of the CM1xx microphone mixer also effects 
this level. Obviously, getting the audio input level right is important to those who are listening to you across the network.

The `app_rpt` tuning utility displays a real-time audio level meter to help you make
these adjustments. Given the heritage of the ASL system and its creators, it's 
not surprising that this meter displays audio levels in units of FM deviation. In fact, almost
all of the [audio setup documentation for the ASL system](https://allstarlink.github.io/adv-topics/audio-level/) is written from the perspective of deviation levels for 
an FM modulator. Moreover, the setup documentation assumes that you have access 
to a nice RF service monitor
like the [HP/Agilent 8921A](https://www.testwall.com/media/catalog/product/file/HP_83205A-97483.pdf). You can get a refurbished one (calibrated) for around $5,000,
so that's no problem. :-)

The [guidance for setting up the receive audio level](https://allstarlink.github.io/adv-topics/usbinterfaces/#setting-audio-levels) asks you to:

> Talk at a normal and steady volume into the microphone and be sure that the 
> average level does not go past the "3KHz" point, and that peak levels do 
> not go significantly past the "5KHz" point.

Meanwhile, the other method that seems to be widely used - particularly by those
few hams who might not own a service monitor - is to call one of the 
parrot stations on the network. [Texas 55553](https://mackinnon.info/ampersand/parrot-55553-notes) or [UK 40894](https://hubnetwork.uk/parrot/) are examples of good ones. However, these parrots aren't calibrated  
in terms of FM deviation units. Instead, they provide a subjective assessment
of audio level with phrases like _"pretty good"_ (TX 55553) or _"your audio is perfect"_ (UK 40894). In the case of the UK parrot there is also a web-based level meter that
provides a more scientific display - more below.

So what does all of this translate to in terms of the actual bits being transmitted on 
the ASL network? What we need to figure out is how these various tools work in terms 
of conventional digital audio level units of dBFS (full-scale) that would be familiar
to a modern-day VOIP engineer. **Nothing in this article is trying to second-guess the instructions
around the use of the deviation meter in the ASL tune utility.
I'm just trying to understand the math behind it.**

Admittedly, this is a confusing discussion. Sometimes you hear comments like _"Why dbFS? I thought that's only for digital waveforms?"_ or _"My common understanding was the reference for flat audio is 1v P-P with a 1 kHz tone"_ or _"5 kHz deviation at FM flat audio is the best practice"_. All of those comments may be true, but hopefully it's clear that a VOIP audio stream is 
just a string of numbers. There's no way to transmit a voltage on a VOIP data stream. There is no FM deviation in a VOIP data stream. There are no milliwatts transferred through a VOIP data stream. The only thing that can be expressed in a VOIP sample is a numeric value relative to the dynamic range of the CODEC being used. A convention is needed to map electrical
measurements onto the available numeric values.

## app_rpt Tune Display

I've been looking at the `app_rpt` code to try to figure out what "5kHz point" really 
means in terms of the IAX2 voice data flowing onto the network. You can only figure this out by counting spaces.

The meter is driven by a peak amplitude variable `apeak` which is compted (`chan_simpleusb.c`) 
from the minimum `amin` 
and maximum `amax` 16-bit signed PCM values seen in each sample window:

    apeak = (amax - amin) / 2

So the `apeak` value for a "full swing" audio sample (i.e. maximum possible deviation) would be
32767.

Since the meter was built using ASCII art, the `apeak` value needs to be converted to 
a set of = characters that display a bar across the typical 80 column text terminal.
This happens in the `tune_rxdisplay()` function:

    meas = apeak
    ncols = 75
    thresh = (meas * ncols) / 16384

This implies that a full swing signal would require about 150 columns of text. Doing the 
math the other way:

    meas = thresh * 16384 / ncols 

Working backwards to understand what 5kHz deviation means is tricky because the math 
isn't explicitly stated in the code. It requires counting the columns in these lines 
which are probably familiar to anyone who has used the tuning utility:

    ast_cli(fd, "RX VOICE DISPLAY:\n");
    ast_cli(fd, "                                 v -- 3KHz        v -- 5KHz\n");

I count 34 spaces to get to the 3kHz point and 51 to get to the 5kHz point. Let's just hope the user has selected a monospaced font! HIHI. 

Using the ratio above, 3kHz corresponds to an `apeak` of 7,430 and 5kHz corresponds to 11,100. In dBFS
terms this means that 3kHz is -12 dBFS peak and 5kHz is -9 dBFS peak. (NOTE: This 
squares with the advice that career TV broadcast engineer Dan Brown W1DAN once gave me: "always leave around 10dB of headroom.")

Now going back to the official ASL guidance: _"be sure that the 
average level does not go past the 3KHz point ..."_. This meter
measures peak, so we shouldn't confuse the -12dBFS level (3kHz) 
with average in the RMS sense. For a pure tone the -12dBFS peak 
point would
correspond to a -15dB RMS level, but we're not dealing with 
pure tones usually so I'm not sure how to translate the guidance
around the 3kHz point into RMS dBFS. Suggestions welcomed.

## TX 55553 Parrot

Patrick N2DYI has given me a lot of useful information about the way his parrot works
and how levels should be computed in general. I've done a [separate article on the full details of 55553](https://mackinnon.info/ampersand/parrot-55553-notes). Bottom line: Patrick 
does his work using RMS (average) levels, *not peak levels.* And definitely nothing 
to do with FM deviation. His mapping is as follows:

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
the network. During this test the display meter on the playback website registered a steady -10. So **that scale is calibrated in peak dBFS,** with nothing to do with 
FM deviation.

Testing at several different levels, the UK parrot lady reported that my audio was 
"very loud" at anything above -16dBFS peak, "loud" down to around -19dBFS peak, "perfect" down to 
around -28dBFS peak, and "low" below that. Based on this, I surmise that the UK parrot voice
prompts use **a scale that is calibrated in RMS (average) power dB.** Note that the 
breakpoints are almost perfectly consistent with TX 55553 above.

The voice prompts notwithstanding, the web interface instructs users to _"Keep your 
audio in the amber range"_ which
extends from -15dBFS to -5dBFS peak. -5dbFS seems like a high target to me (TX 
parrot guy tells me _"yeah ... that's just way, way, too loud."_) but at least the amber part of the scale
is centered around the -10dBFS peak level which falls in the "perfect" range from 
the voice prompt.

The web interface also displayed an "RMS Level" of 6930 for my test. This checks out as well since:

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

David also added some useful comments in reaction to the "-10dB of headroom" 
recommendation espoused above.

> Note re. "... advice that career TV broadcast engineer Dan Brown W1DAN once gave 
> me: "always leave around 10dB of headroom." - This applies in the context 
> of a broadcast system where you have full control over the source content but 
> are then going into transmitter systems that are very sensitive to clipping/distortion.
>
> The context in ROIP is quite different however:
> 
> 1. We do not have control over the source content. If you encourage everyone 
> to set their levels at -10dBFSpk, but then some users for whatever reasons set 
* their levels at -1dBFSpk (which sounds perfectly good - not clipped or distorted 
> at all), now you have 9dB of levels variation, resulting in highly inconsistent 
> levels on the network. Thus in this case it's better to follow digital audio 
> level standards than broadcast TV standards.
>
> 2. The vast majority of nodes are not directly driving an FM modulator input.  
> Most nodes are either using (a) normal mic inputs on a radio device – which 
> have thorough filtering and limiting that prevents over-deviation, or (b) 
> radio-less or various apps that are not outputting to a transmitter.
>
> These contextual distinctions are important and very easy to overlook. Targeting 
> peak levels of <= -10dBFS makes sense only in the context of USBRadio driving a 
> direct FM modulator input. In other contexts, chief among those being IAX
> audio levels, it does not make sense and should not be the goal. 

I think David's point about the context of W1DAN's -10dB recommendation being 
broadcast-centric is likely fair, although Dan has also setup/maintained a lot
of FM repeater systems as well.

It is also true that audio on the network varies widely, possibly on the order of 
9dB, and possibly because of the differences in the ways these tools are 
calibrated. That being said, the fact that all three of the existing "references" for 
the ASL network (tune, TX 55553, and UK 40894) seem to have been encouraging a 
level at or below -10dBFS peak can't be ignored. The top priority should be to 
avoid clipping, but after that, the next priority should be as much consistency 
across stations as possible.

## The Ampersand Parrot Implementation

Given the difference in opinion about the "right" audio level, the Ampersand
Parrot implementation provides the actual peak dB and RMS average power dB
levels in the read-back. So at least there's no mystery there.

Per the recommendations of Patrick and David, the first and last ~500ms of the 
recording are discarded before the analysis. This is very good advice given how 
much leading trailing clicks/pops/silence can mess up the analysis.

(TODO: Add comments about user-friendly summarization to be implemented.)

## Another Data Point: chan_voter

Lee VE7FET pointed out that there is another reference to signal levels in the `chan_voter.c`
code. Towards the top we have this:

    /* This array is used by the voter tune CLI command to send a 1kHz tone at
    * full system deviation to all clients (with transmit enabled) in an instance.
    */
    static unsigned char ulaw_digital_milliwatt[8] = { 0x1e, 0x0b, 0x0b, 0x1e, 0x9e, 0x8b, 0x8b, 0x9e };

I'd not heard the term "[digital milliwatt](https://en.wikipedia.org/wiki/Digital_milliwatt)" before,
but apparently it is an official digital telephony concept. According to the standard, this 
uLaw stream is supposed to generate a 1kHz reference signal with 0dBm of power (one milliwatt).

I don't think the actual 1mW signal reference is relevant in our system. But we can say 
with some confidence that this stream of uLaw values produces a 1kHz PCM16 stream with peak 
value of at least +20,860, or about -3dBFS. So if the comment in the code is right, the voter thinks that 
full deviation (5kHz?) comes from a -3dBFS tone.  That is a different calibration from the other 
things described so far. 

I'm not a Voter user so I don't have any experience here. I did 
receive one comment from an experienced AllStar user:

> Anecdotally, I have noticed that nodes using voters tend to 
> be just a little quieter on average than those tuned within
> tolerance using either simpleusb or usbradio. So, maybe 
> that explains it.

If someone was aligning their transmitter for 5kHz deviation
using a very loud -3dBFS peak tone, I guess it stands to reason 
that "normal" stations that were transmitting somewhere around
-10dBFS peak would sound quieter.

(More investigation needed.)

## Other Notes

[Per datasheet](https://www.mpja.com/download/36814cp%20cm108%20data.pdf), the dynamic range of the ADC in the CM108 is 81dB.

[Per datasheet](https://www.micros.com.pl/mediaserver/info-uicm108b.pdf), the dynamic range of the ADC in the CM108B is 88.5dB.

[Per datasheet](https://www.masterscommunications.com/products/radio-adapter/pdf/cm119-datasheet.pdf), the dynamic range of the ADC in the CM119 is 81.6dB.

[Per datasheet](https://www.ti.com/lit/ds/symlink/pcm1804.pdf?ts=1769162410131&ref_url=https%253A%252F%252Fwww.google.com%252F). the dynamic range of the PCM1804 (used in the SDRC) is 112 dB.

The dynamic range of the G.711 uLaw CODEC is equivalent to about 13 bits, or around 78dB.



