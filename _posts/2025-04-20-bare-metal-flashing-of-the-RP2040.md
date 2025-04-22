---
title: Bare Metal Flashing of RP2040
---
# Introduction

I'm working on a radio project that requires the ability to perform a 
remote flash of the firmware on an RP2040-based board via a low-speed
LoRa radio link. The "standard" way to flash an RP2040 board is to use a 
USB-connected [Raspberry Pi Debug Probe](https://www.raspberrypi.com/documentation/microcontrollers/debug-probe.html) (or similar device) attached to a
host computer running OpenOCD. That works great on the bench, but I'd
like something simpler and more compact. That led me to a research 
project to understand how the SWD-based flashing mechanism on the RP2040
actually works. Is it possible to create a simple device that can drive 
the RP2040's SWD pins and update its firmware?  Let's find out.

I'm not going to get into the details of the wireless part of this project
in this article - more on that later.

NOTE: I'm using the term "RP2040" here in a general sense. Everything described
will also work on the RP2350, as well as other ARM Cortex-M0-based systems.

# SWD Basics

The RP2040 provides a two pin "Serial Wire Debug" (SWD) port. The commercial Pi Pico 1/W/2 boards all break out these two pins into a separate connector that can be connected to a 
debug probe like the Pi Debug Port, a JLink, or a Segger. The SWD connector is marked in red here:

![Debug Pins](/assets/images/IMG_1982.jpg)

I'm not going to get into the details of these commercial probes since they are described 
in many other articles.
The key thing to understand (which was new to me) is that there is no "magic" to driving 
the SWD port on an RP2040. This two-pin interface works very much like an I2C port and 
can be driven by any 3.3V-compatible device that can wiggle two GPIO lines in a way
that follows the SWD protocol. I hope this article removes some of the mystery around 
that process.

I am driving the SWD port using a *second* RP2040 board (a Pi Pico 1), but that isn't 
a requirement - any other controller can be used. In fact, if you look closely at the 
Raspberry Pi Debug Probe you'll see that it's exactly the same thing: an RP2040 with 
special firmware needed to interface the USB port to the two-wire SWD port.  Here's
a picture of the setup that I used to build/test my flasher:

![Debug Pins](/assets/images/IMG_1981.jpg)

The Pi Pico on the left is the "target" board, i.e. the one being flashed. The Pico on the right is the "source" board where the flashing code is running.  My source board is connected to a normal Raspberry Pi Debug Probe and is flashed the normal way.

## Physical Interface

As you can see from the picture above, the two SWD pins of the target board are connected to GPIO pins on the source board. 
There is also a reference ground pin on the target SWD connector that is tied to the ground on the source board.
Unrelated to the flashing process, my target board is being powered from the +5V USB connection on the source board via
the red wire (VBUS connection).

There are two pins on the SWD port. They follow normal 3.3V logic:
* The SWCLK pin is always driven by the source. This provides the serial data clock for the target 
board in the same way what the SCL pin works on an I2C interface. It doesn't matter too much what frequency 
this clock is driven at, so long as it falls within the allowable range of the SWD protocol and/or 
your cables. The RP2040 suggests a *maximum* clock rate of 24 MHz.  I am using something much slower, 
around 500 kHz.  Importantly, there is no requirement that the clock rate is even constant. I've traced
the pins on commercial SWD probes and seen all kinds of pauses floating through the protocol exchanges.
The important thing is the relationship between the timing on the SWCLK and SWDIO pins - that is critical.
* The SWDIO pin is driven by the source when sending data to the target and is driven by the 
target when sending data to the source. Again, very similar tpo the SDA pin on an I2C interface.

## Sending a Bit

## Receiving a Bit

## SWD Handshake

## SWD Write Sequence

## SWD Read Sequence

# Overview of Flashing Process

# RP2040/RP2350 Flash Sequence

# Important References

# Other Notes
