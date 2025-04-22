---
title: Bare Metal Flashing of the RP2040
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
the SWD pins on an RP2040-based board and update its firmware?  Let's find out.

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
The key thing to understand (which was new to me) is that there is no "magic" involved 
when driving 
the SWD port on an RP2040. This two-pin interface works very much like an I2C port and 
can be driven by any 3.3V-compatible device that can wiggle two GPIO lines in a way
that follows the SWD protocol. I'm driving the SWD interface using a second RP2040, 
but that is not a requirement - *any other GPIO-capable device could be used to flash 
an RP2040 board*, so long as it follows the SWD protocol rules. I hope this article removes 
some of the mystery around this process.

Here's a picture of the setup that I used to build/test my flasher:

![Debug Pins](/assets/images/IMG_1981.jpg)

The Pi Pico on the left is the "target" board, i.e. the one being flashed. The Pico on the right is the "source" board 
where my flashing code is running. My source board is connected to a normal Raspberry Pi Debug Probe 
and is flashed the normal way.

## Debug Hardware

The RP2040 chip contains some special ARM hardware that enables remote debug. This hardware is officially 
know as a "CoreSight compliant Debug Access Port (DAP)." External debug/flash systems like the one I am building
communicate with the CoreSight hardware via the Serial Wire Debug (SWD) connections.

One thing to understand is that the the CoreSight debug system is almost completely independent of the rest of the 
Cortex processor cores inside of the RP2040. This means that the debug interface runs (and maintains state)
even when the core processor(s) are crashed and/or rebooted. This is obviously critical for any low-level debugging
capability.

It turns out that the RP2040 flashing process can be carried out over the SWD debug port because of three key 
enabling features:
* You can read/write arbitrary locations in core memory via the SWD port.
* You can command the processor execute arbitrary functions via the SWD port. 
* The low-level driver firmware required to erase/write the flash memory on an RP2040-based board is available in the 
factory ROM inside of the RP2040 chip.

If you can understand how to use these three features, you can flash the board via SWD.

## SWD Physical Interface

As you can see from the previous photo, the two SWD pins of the target board are connected to GPIO pins on the source board. 
There is also a reference ground pin on the target SWD connector that is tied to the ground on the source board.
Unrelated to the flashing process, my target board is being powered from the +5V USB connection on the source board via
the red wire (VBUS connection).

There are two pins on the SWD port. They follow normal 3.3V logic:
* The SWCLK pin is always driven by the source. This provides the serial data clock for the target 
board in the same way what the SCL pin works on an I2C interface. It doesn't matter too much what frequency 
this clock is driven at, so long as it falls within the allowable range of the SWD protocol and/or 
your cables. The RP2040 suggests a *maximum* clock rate of 24 MHz.  I am using something much slower, 
around 500 kHz. Importantly, there is no requirement that the clock rate is even constant. I've traced
the pins on commercial SWD probes and seen all kinds of pauses floating through the protocol exchanges.
The important thing is the relationship between the timing on the SWCLK and SWDIO pins - that is critical.
* The SWDIO pin is driven by the source when sending data to the target and is driven by the 
target when sending data to the source. Again, very similar tpo the SDA pin on an I2C interface.

This is a bi-directional serial interface, so all of the complex exchanges of data on the SWD port boil 
down to a simple process of sending or receiving a bit. Those two processes are explained next.

## Sending a Bit to the Target

When the protocol requires the source to send a bit to the target we must make sure that the 
SWDIO GPIO pin on the source is configured for output. Once that is done, it's very straight-forward.
The code from my driver is the best description of what to do:

        void SWDDriver::writeBit(bool b) {
            // Assert the outbound bit to the slave on the SWDIO data pin
            _setDIO(b);
            // Wait about 1uS for setup.
            _delayPeriod();
            // Raise the SWLCK clock pin. Slave will capture the data on this rising edge.
            _setCLK(true);
            // Wait around 1uS for hold
            _delayPeriod();
            // Lower the SWCLK clock pin.
            _setCLK(false);
        }

## Receiving a Bit From the Target

When the protocol requires a bit to be received from the target the GPIO pin used
for the SWDIO pin is switched into input mode. The actual receive code from my driver
looks like this:

        bool SWDDriver::readBit() {
            // The inbound data is already asserted by the slave on the previous falling 
            // clock edge.  Wait about 1uS for setup.
            _delayPeriod();
            // Read the value from the SWDIO data pin
            bool r = _getDIO();
            // Raise the SWCLK clock pin.
            _setCLK(true);
            // Wait about 1uS.
            _delayPeriod();
            // Lower the SWCLK clock pin.
            _setCLK(false);
            return r;
        }

## SWD Handshake

There are a few steps that need to be followed to initialize the SWD interface. The details are explained
in these documents:

* An IEEE standard document (1149.7) that I don't have access to.
* A paper called [Low Pin-count Debug Interfaces for Multi-device Systems](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Low_Pin-Count_Debug_Interfaces_for_Multi-device_Systems.pdf) that summarizes the IEEE 1149.7 standard.
* The [ARM Debug Interface Architecture Specification ADIv5.0 to ADIv5.2](https://developer.arm.com/documentation/ihi0031/latest/) 

I will try to avoid repeating everything in these documents and, instead, outline the precise steps that my (working)
flashing is following. Hopefully I am not doing anything that contradicts the official documents.

### Step 0: Connect the Physical Interface

This is pictured above: connect two GPIO pins from the source board to the SWD pins on the target board, including 
a ground reference.  

### Step 1: Initial State

Pull the SWCLK and SWDIO pins low and then send 8 1's.

### Step 2: Send Selection Alert

This is a protocol reset message that is needed to get the CoreSight DAP interface into a known state, 
regardless of what it was doing previously. According to 
the article by Michael Williams linked above:

> Hence the designers of multi-drop SWD chose an unlikely
> data sequence approach. The selection message consists of a
> 128-bit selection alert, followed by a protocol selection
> command. This selection alert method has been adopted by
> IEEE 1149.7, and multi-drop SWD has adopted the IEEE
> 1149.7 protocol selection command, ensuring compatibility
> between the two protocols.

The 128 bits look like this:

        0100 1001 1100 1111 1001 0000 0100 0110 1010 1001 1011 0100 1010 0001 0110 0001
        1001 0111 1111 0101 1011 1011 1100 0111 0100 0101 0111 0000 0011 1101 1001 1000

(The spaces above are provided only to make the strings easier to read.)

### Step 3: Send Activation Code

## SWD Write Sequence

## SWD Read Sequence

# Overview of Flashing Process

# RP2040/RP2350 Flash Sequence

# Important References

# Other Notes
