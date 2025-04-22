# Introduction

I'm working on a radio project that requires the ability to perform a 
remote flash of the software on an RP2040-based board via a low-speed
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

The RP2040 provides a two pin "Serial Wire Debug" (SWD) port. The commercial Pi Pico 1/W/2 boards all break these two pins out into a separate connector that can be connected to a 
debug probe like the Pi Debug Port, a JLink, or a Segger. I'm not going to get into
the details of these probes since they are described in depth in many other articles.
The key thing to understand (which was new to me) is that there is no "magic" to driving 
the SWD port on an RP2040. This two-pin interface works very much like an I2C port and 
can be driven by any 3.3V-compatible device that can wiggle two GPIO lines in a way
that follows the SWD protocol. I hope this article removes some of the mystery around 
that process.

I am driving the SWD port using a *second* RP2040 board (a Pi Pico 1), but that isn't 
a requirement - any other controller can be used. In fact, if you look closely at the 
Raspberry Pi Debug Probe you'll see that it's exactly the same thing: an RP2040 with 
special firmware needed to interface the USB port to the two-wire SWD port.

## Physical Interface

## Sending a Bit

## Receiving a Bit

## SWD Handshake

## SWD Write Sequence

## SWD Read Sequence

# Overview of Flashing Process

# RP2040/RP2350 Flash Sequence

# Important References

# Other Notes
