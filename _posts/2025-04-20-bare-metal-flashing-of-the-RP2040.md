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
will also work on the RP2350.

# Background: The SWD Interface and Debugging Basics

The RP2040 is flashed using an interface that was originally intended for 
in-system debugging. In order to understand the flash process, you need
to understand the ARM debug mechanism. The next few sections walk through
this background. Note that this information may be useful for other 
debug purposes unrelated to flashing.

The description of the debug mechanism in the RP2040 datasheet (section 2.4.2.4) is 
extremely brief. I think the 
RPi team expects you to either (a) flash use their off-the-shelf debug probe or (b)
use the ARM documentation to understand the details of the debug port. I had 
a hard time piecing this together for myself, but it does work in the end.

The most important/detailed document is the [ARM Debug Interface Architecture Specification ADIv5.0 to ADIv5.2](https://developer.arm.com/documentation/ihi0031/latest/).  The RP2040 follows the ADIv5.1 specification.

If you already understand SWD/debug you can skip down to the parts about
flashing.

## SWD Basics

The RP2040 provides a two pin "Serial Wire Debug" (SWD) port. The commercial Pi Pico 1/W/2 
boards all break out these two pins into a separate connector that can be connected to a 
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

### Debug Hardware

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

### SWD Physical Interface

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

### Sending a Bit to the Target

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

### Receiving a Bit From the Target

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

### SWD Handshake

There are a few steps that need to be followed to initialize the SWD interface. The details are explained
in these documents:

* An IEEE standard document (1149.7) that I don't have access to.
* A paper called [Low Pin-count Debug Interfaces for Multi-device Systems](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Low_Pin-Count_Debug_Interfaces_for_Multi-device_Systems.pdf) that summarizes the IEEE 1149.7 standard.
* The [ARM Debug Interface Architecture Specification ADIv5.0 to ADIv5.2](https://developer.arm.com/documentation/ihi0031/latest/) 

I will try to avoid repeating everything in these documents and, instead, outline the precise steps that my (working)
flashing is following. Hopefully I am not doing anything that contradicts the official documents.

#### Step 0: Connect the Physical Interface

This is pictured above: connect two GPIO pins from the source board to the SWD pins on the target board, including 
a ground reference.  

#### Step 1: Initial State

Pull the SWCLK and SWDIO pins low and then send 8 1's.

#### Step 2: Send Selection Alert

This is a protocol reset message that is needed to get the CoreSight DAP interface into a known state, 
regardless of what it was doing previously. According to 
the _Low Pin-Count Debug Interface_ article linked above:

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

#### Step 3: Send Activation Code

A special activation code is used to enable communication with the ARM CoreSight debug system. The 16 
bits look like this:

        0000 0101 1000 1111

(The spaces above are provided only to make the strings easier to read.)

#### Step 4: Send Line Reset

The next series of steps is described beginning with section B4.3.4 of the ARM Debug Interface Architecture Specification
IHI0031.  

A line reset is sent to the target.  A line reset is created by sending 64 consecutive 1s to the target.

#### Step 5: Send 8 Zeros

8 consecutive 0s are sent to the target.

#### Step 6: Send a DP Target Select

At this point the protocol starts to follow a standard messaging format that can read or 
write 32-bit payloads to specific registers in the target debug interface's space. The 
precise mechanics of these read/write transactions are explained below.

This is the part of the handshake sequence were where we decide which of the processor
cores we would like to connect to. For an RP2040 the two cores have these addresses:

* Core 0: 0x01002927
* Core 1: 0x11002927

The desired core address needs to be written to the DP SELECT register (0xc). In my 
testing I always connected to core 0. So 0x01002927 was written to DP register 0xc.

*IMPORTANT NOTE:* Normally a write transaction would be acknowledged by the target using a 
3-bit response code that will be explained below. For this particular step in the 
protocol (and only this step) the acknowledgement is ignored. Actually, the target
doesn't even drive the acknowledgment phase for this particular step in the transaction
because of the multi-drop nature of the SWD bus internal to the RP2040 SOIC.

#### Step 7: Read The Target's ID CODE

A read transaction on the DP's IDCODE (0x0) register is required.  The RP2040 will return an IDCODE of 0x0BC12477.

#### Step 8: Send a Precautionary Abort

A write transaction on the DP's ABORT (0x0) register is used to make sure there is no work in process.

#### Step 9: Select AP 0

A write transaction on the DP's SELECT (0x8) register is used to select AP 0/Bank 0.  (NOTE: I'm a bit
unclear on the reason for this step, but it appears to be necessary.)

#### Step 10: Send a Power Up of the Debug System

A write transaction on the DP's CTRL/STAT (0x4) register is used to request that the debug circuits are powered
on. The CSYSPWRUPREQ (30), CDBGPWRUPREQ (28), and ORUNDETECT (0) bits are set to 1.

#### Step 11: Read the CTRL/STAT To Validate Power

A read transaction on the DP's CTRL/STAT (0x4) register is used to make sure that power on was successful. 
The CSYSPWRUPACK (31) and CDBGPWRUPACK (29) bits are checked.

I'm not completely sure, but it's possible that the power-up process is asynchronous. It may be necessary
to read these two ACK status bits in a loop. More research is needed, but so far everything seems to come 
up on the first try.

#### Step 12: Check AP ID

This step is probably not necessary, but is used to validate the identification of the MEM-AP port 
in the CoreSight system.  

First, AP 0 and register bank F are selected by writing a 0x000000f0 to the DP SELECT (0x8) register.

Next, an AP read is performed on address 0x0c. This is the AP identification register.

Finally, the data from the previous read is retrieved by reading the DP RDBUFF (0xc) register. I am 
seeing an AP ID of 10005AC3.

#### Step 13: Leave the AP Bank 0 Selected

First, AP 0 and register bank F are selected by writing a 0x00000000 to the DP SELECT (0x8) register.

#### Step 14: Configure the AP Transfer Mode

The DP CTRL/STAT (0x0) register is configured to control the AP data access going forward. There are
two configurations:

* Auto increment is turned on by writing 0b01 into bits 5:4.
* Word transfer (i.e. 32-bits) is selected by writing 0b010 into bits 2:0.

### SWD Write Transaction Sequence

Once the first few "free form" steps of the handshake are complete, all communications between the 
source/target happen using standardized read and write transactions. These transactions are 
explained in great detail in the official ARM documentation so I won't repeat all of that.  This 
section provides a quick summary of the write transaction.

* The source sends an 8-bit write request.
    * A start bit (1)
    * The AP/DP select bit. 0 means DP, 1 means AP.
    * The write bit (0)
    * A two-bit address in little-endian format. These are the 
two MSB bits of the AP/DP register selection. The two LSB bits are always zero.
    * A single parity bit (even) across the 8-bit write request.
    * A stop bit (0)
    * A park bit (1)
* The SWDIO line is released and turned to input mode so that it can be driven by the target.
* A bit is read from the target, but ignored. This is called a turn-around bit.
* A three-bit acknowledgement is read from the target in little endian format.  A 0b001 code means "success." Anything else is treated as a failure, although strictly speaking this is not correct since one of the acknowledgment codes (WAIT) means to try again later. I 
have not implement this because it is not needed in my flashing program.
* The SWDIO line is converted back to output mode so that it can be driven by the source.
* A bit is written by the source, but ignored. This is called a turn-around bit.
* A 32-bit value is written in little-endian format (i.e. LSB first). This is called the data transfer phase.
* A 1 bit parity (even) is written.

### SWD Read Transaction Sequence

Once the first few "free form" steps of the handshake are complete, all communications between the 
source/target happen using standardized read and write transactions. These transactions are 
explained in great detail in the official ARM documentation so I won't repeat all of that.  This 
section provides a quick summary of the read transaction.

* The source sends an 8-bit read request.
    * A start bit (1)
    * The AP/DP select bit. 0 means DP, 1 means AP.
    * The read bit (1)
    * A two-bit address in little-endian format. These are the 
two MSB bits of the AP/DP register selection. The two LSB bits are always zero.
    * A single parity bit (even) across the 8-bit read request.
    * A stop bit (0)
    * A park bit (1)
* The SWDIO line is released and turned to input mode so that it can be driven by the target.
* A bit is read from the target, but ignored. This is called a turn-around bit.
* A three-bit acknowledgement is read from the target in little endian format.  A 0b001 code means "success." Anything else is treated as a failure, although strictly speaking this is not correct - see notes on WAIT above.
* A 32-bit value is read in little-endian format (i.e. LSB first). This is called the data transfer phase.
* A 1 bit parity (even) is read.
* The SWDIO line is converted back to output mode so that it can be driven by the source.
* A bit is written by the source, but ignored. This is called a turn-around bit.

## Accessing Memory (or Mapped Registers) via SWD

Now the we understand the SWD port, we can get into the process of reading/writing
from/into the memory space of the processor. 

Unlike some other ARM Cortex parts
that you might have used (ex: STM32), *it is not possible to 
write directly into the flash memory of an RP2040 board*. This is because *there is 
no on-chip flash on an RP2040.* Instead, the flash memory in an RP2040 system is 
generally contained in an external QSPI flash chip that is mounted onto the board
adjacent to the CPU SOIC. The QSPI flash can be mapped into the processor's memory 
space and read directly via the RP2040 XIP mechanism, *but this doesn't work for writes.* Instead,
writes are achieved using a serial protocol that looks more like SPI.

That said, you still need to be able to read/write the processor's address space
in order to carry out the flashing steps that are outlined below.

Reads/writes into the RP2040 address space can be accomplished over the SWD debug 
port via a part of the CoreSight hardware called the Memory Access Port (MEM-AP).

Reads/writes always happen in 32-bit words on word-aligned address boundaries.

The steps to write are simple:

* Write the address of the word you want to write into the AP TAR (0x4) register.
This must be on a word boundary (i.e. two LSBs are zero).
* Write the data you want to write into the AP DRW (0xC) register.

Strictly speaking, the write doesn't take effect until at least 8 more clock 
cycles have passed, but that generally happens are part of the next operation
so this delay is not noticed.

The steps to read are almost as simple:

* Write the address of the word you want to read into the AP TAR (0x4) register.
This must be on a word boundary (i.e. two LSBs are zero).
* "Read" the data you want from the AP DRW (0xC) register. This is a bit tricky
because no data is returned by this operation, but instead it is moved into a 
DP register to be ready for the next step.
* Read the DP RDBUF (0xC) register to get the data.

## Accessing Processor Core Registers via SWD

The section above discuss how to read/write data in the processor address space.
The "core registers" of the ARM processor (i.e. PC, LR, R0..R12, etc.) *are not memory
mapped*, so a special mechanism is required.

This mechanism involves the use of three registers that *are memory mapped*, specifically 
the confusingly-named Debug Core Register Data Register (DCRDR), Debug Core Register 
Selector Register (DCRSR), and Debug Halting Control and Status Register (DHCSR).

Follow these steps to write to a processor core register:

* Write the data you want to write into the address location 
of the DCRDR (address 0xE000EDF8) using the process in the previous section.
* Write the appropriate selector for the desired core register  
into the DCRSR (address 0xE000EDF4) using the process in the previous section. This
selector will contain a 1 in the bit 16 position signifying a write, and then the 
register number in bit positions 6:0.  For example, writing core register R7 uses 
a DCRSR selector of 0x00010007.
* Poll (i.e. repeatedly read) the location of the DHCSR (address 0xe000edf0) using the process
explained in the previous section until the S_REGRDY bit (bit 16) turns to 1.

Follow these steps to read from a processor core register:

* Write the appropriate selector for the desired core register  
into the DCRSR (address 0xE000EDF4) using the process in the previous section. This
selector will contain a 0 in the bit 16 position signifying a read, and then the 
register number in bit positions 6:0.  For example, reading core register R7 uses 
a DCRSR selector of 0x00000007.
* Poll (i.e. repeatedly read) the location of the DHCSR (address 0xe000edf0) using the process
explained in the previous section until the S_REGRDY bit (bit 16) turns to 1.
* Read the final result from the the address location 
of the DCRDR (address 0xE000EDF8) using the process in the previous section.

As you can tell from the description above, reading/writing processor core registers is
an asynchronous process and care must be taken to monitor the S_REGRDY flag to determine
when the operation has completed.

## Entering Debug Mode, Halt and Resume via SWD

## Resetting into Debug Mode via SWD

# Overview of Flashing Process

Finally, with all of the SWD/debug background out of the way we can get back to the topic of flashing memory.

# RP2040/RP2350 Flash Sequence

# Calling A ROM Function on the RP2040 Via SWD

# Important References

# Other Notes
