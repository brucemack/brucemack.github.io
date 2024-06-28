---
layout: post
title:  "IBM 1620 - Input-Output Writer, Model B"
tag-name: ibm1620
categories: [ "ibm1620" ]
---

It's hard to believe I'm writing a post about electric typewriters. My
parents would be disappointed that my years of engineering education 
have come to this. I can take solace in the fact that I'm not 
typing this **on** an electric typewriter. At least, not yet - I'll
regress to that level eventually.

The IBM 1620 didn't have a screen or a mouse. But it had an integrated
keyboard and printer in the form of an electric typewriter. This was not an ordinary typewriter.

# Interesting Clock Feature

While studying the clock generation logic [as described in my last post](/ibm1620/2024/06/25/clocks-working.html), I was puzzled by an input signal called -S HOLD TR P1 that comes from 
page 01.64.12.1 of Dave's ALD set - way towards the back of Volume 3. Normally you'd think of 
the system clock as a __driver__ of all computer activity, so seeing a logic __input__ to the 
clock tree caught my 
attention. I'll get into this in more detail in a future post, but the ALD page where this signal 
originates is called **I┘O CONTROL** and, among 
other things, it defines the start of the integration with the I/O typewriter. 

Long story short: the 1620's system clock is stopped during I/O operations to allow 
the slow mechanical devices - including the humans in front of them - to do their jobs. It's like you're flying down the tracks at 1 MHz until one of 
the I/O instructions comes along, at which 
point you slam on the brakes and the entire machine is halted until that operation finishes. If someone executes a Read Numerically (RN 36) instruction
and then gets called away for dinner the whole machine is just stuck. This 
is very strange by today's standard, but the concept of asynchronous I/O did not exist on 
the 1620. 

This revelation led me to examine the 20 or so ALD pages related to the I/O typewriter.  Those
pages are quite interesting, and unexpected in many ways. I _am not_ an IBM typewriter expert, 
nor have I done extensive research. I'm providing what I can discern from the circuits 
and documentation. Anyone who knows more should drop me a line and 
I'd be glad to elaborate my post.

# Check out the Cadetwriter Project

Dave Babcock and team have done a lot of work [on an interesting project called the Cadetwriter](https://github.com/IBM-1620/Cadetwriter) that replicates a 1620-style I/O typewriter using a slightly less vintage, but still satisfyingly-mechanical IBM Wheelwriter typewriter from the 1980's. It 
features one of those buckling spring "tactile feedback" keyboards - so nice.
It's probably not quite as satisfying as the feel of the mechanical hammer of a Model B electric typewriter striking the page, but it's the next best thing.

![Wheelwriter](/assets/images/cadetwriter-1.jpg)

The Cadetwriter provides a functional I/O simulation of the 1620 typewriter, including some 
multi-strike cleverness 
around the font issues needed to obtain peculiar characters that were used in the 1620 days. However,
Cadetwriter doesn't attempt to replicate the 1620-era hardware.  In order to avoid re-hashing
any of the excellent work done by the Cadetwriter team, I'm going to focus my analysis/documentation
on the original 1620 hardware as much as possible. 

As an aside:
the tooling used by IBM to manufacture those tactile-feedback keyboards 
was sold to 
[UNICOMP and you can buy modern USB-enabled versions](https://www.pckeyboard.com/page/SFNT) of those nice (loud) keyboards.

# The Original Model B Typewriter

The 1620 documentation just calls it "The Typewriter" - not very exciting.  It doesn't seem 
to have a machine number 
like the sexier tape reader (1621), the tape punch (1624), or the card reader/punch (1622). The engineers probably felt slighted. This is
perhaps related to the fact that The Typewriter was actually borrowed from the mainstream IBM 
product line and integrated into the 1620 console. "The Typewriter" is actually an IBM Model B
electric typewriter with an extensive set of modifications. The official name given 
in [this more recent IBM document of 1966](https://bitsavers.org/pdf/ibm/typewriter/model_b/540-0113-2_IBM_Input-Output_Writer_Model_B_Jan1966.pdf) is the **IBM Input-Output Writer, Model B**. That
sounds slightly more exciting. OK, not really.

![Model B](/assets/images/model-b-1.jpg)

In this post I'll just share a few things I've learned about the typewriter itself. The interface
hardware to the 1620 processor is a fascinating/complex topic that I'll write down later.  

# High-Level Description of the Modifications

Essentially, the Model B electric typewriter was modified to allow "remote control."  The changes
go into these categories:
* An electronic actuator was added to each key to allow the 1620 
to generate output.  It was basically "remote typing" and was similar to a 
player piano.
* An electronic sensor was added to each key to allow user-generated key strokes to be watched and sent to the computer. (This
clever idea was apparently taken by the KGB and used to place a bugged version of an IBM Selectric
[into the US embassy in Moscow](https://www.popularmechanics.com/military/a30370413/typewriter-bugging-cold-war/)).
* A few internal functions of the carriage mechanism were instrumented to allow the detailed status
of the typewriter to be monitored by the 1620 CPU.
* I'm not sure about this, but I suspect that some of the key caps were altered from the 
production Model B to provide R-S (Release and Start), Flag Mark, and Record Mark. Those
don't seem like general-purpose keys.

All of this added almost two inches of height to the bottom of the unit, but it looks like the typewriter sat in a recessed
area on the 1620 console desk so this didn't matter. Thanks to Paul Kimpel for pointing out that 
the photo of what appears to be a modified Model B on the [IBM Electric Typewriter Wikipedia Page](https://en.wikipedia.org/wiki/IBM_Electric) gives a very good view of the 2 inch "platform" that contained
the mechanical modifications needed for computer integration. 

Paul also pointed out that the computer-capable Model 
B Typewriter found use with other non-IBM computers of the day including 
the [JONNIAC](https://en.wikipedia.org/wiki/JOHNNIAC) (RAND Corp), the [PDP-1](https://en.wikipedia.org/wiki/PDP-1) (DEC), and the [Bendix G-15](https://en.wikipedia.org/wiki/Bendix_G-15) (Bendix Corp). So
it would appear that these state-of-the-art typewriters were being sold to other manufacturers on a
stand-alone basis. All
of this explains why this [IBM Input-Output Writer, Model B](https://bitsavers.org/pdf/ibm/typewriter/model_b/540-0113-2_IBM_Input-Output_Writer_Model_B_Jan1966.pdf) document reads a bit like a 
sales brochure with statements like: _"... an efficient print out device for computers and other similar equipment ..."_ and _"A power supply of 42-48 volts DC is required ... this power supply 
must be provided by the purchaser."_  You'd never see anything like that in a normal IBM manual.

Adding to Paul's observations, I can see a blogger working on a [Bendix G-15 restoration project](https://headspinlabs.wordpress.com/2022/10/04/bendix-g-15-typewriter-console/) has
documented the Bendix "Master Writer" terminal, which is really just a white-labeled IBM Model A/B/C Electric. Looking the Bendix G-15 schematics, I can tell that Bendix had their own typewriter "platform" 
design and was not sharing the the integration electronics used by the 1620.

# Mechanical Realities

I found that it helped a lot to understand the interface circuitry if I kept the 
mechanical realities of the Model B electric typewriter in mind:

* It's called an electric typewriter, but these IBM typewriters are a marvel of mechanical 
engineering.  Refer to numerous YouTube tear-downs to see what I mean. It's 
not quite as electronic as you'd hope.  And, no, there is no serial port.
* The typewriter works at 10 characters per second.  Anything faster runs the risk of a 
jam.
* A normal letter key needs to be pressed for 25 milliseconds to make a complete impression
on the page.
* You might be used to the design of modern inkjet printer, or even an IBM Selectric typewriter 
which holds the paper fixed (at least horizontally) and moves the printing element 
across to form a line of text. The IBM Electrics of this era did the opposite: the printing element
was fixed and the paper was moved horizontally in something called a "carriage" under 
the control of an electric motor.
* Carriage function keys (carriage return, space, tab) require 39 milliseconds to initiate 
because they control a more complicated mechanism.
* Carriage return, tab, and space involve a rotating belt. The time it takes to complete these 
operations is variable. The typewriter has an internal mechanism called an "interlock" to 
prevent typing during carriage movement. This requires feedback to the integration electronics
since there is no concept of a buffer anywhere in this system. The computer needs to be kept in the 
loop to determine when these relatively long-running carriage movements are complete.
* Shift is a mechanical operation that lifts an internal part of the typewriter 
called the "basket." This takes
90 milliseconds to activate and 115 milliseconds to deactivate. A remote control typist
needs to wait for the shift to engage before pressing the next character. (NOTE: 
I suspect this is the limiting
factor that leads to the 10 character per second output data rate.)
* Tab stops are created manually by the operator during setup time.
* Given how tabs work, there is no way to keep count of how many column positions have been used
on a line.  Therefore, an internal switch detects when the end of the line has been 
reached.  I'm assuming this 
was part of the normal Model B system, but this information also needs to be fed back to the integration 
electronics to allow the CPU to react.
* The concept of "overstrike" exists, whereby two character impressions are made without advancing the carriage between them. This implies that the mechanism can control whether 
or not the carriage is advanced after a symbol impression is made. Important examples that I am aware of:
  * Placing a horizontal line (called the "overstrike") above a number to indicate the flag status, which is a 
  1620 concept related to negative numbers and field delimiters.
  * Placing a horizontal line (called a "throughstrike") across a character to indicate a parity error.
* This is a monospace device. Surprisingly, there were some IBM electric typewriters in this
era ("Executive" models) that supported proportional spacing, but this is not one of them.

The supported output symbols are as follows:

* A-Z characters (upper case only)
* 0-9 digits
* Period ( ) + $ * - / , = @
* Overstrike symbol
* Record marker: ╪

(_Need to get a good photo of the keyboard here._)

The keyboard layout is a bit different from what we're used to. Specifically, the numbers keys
are not arranged in a row across the top of the keyboard, but instead are accessed using 
shifted versions of the UIO, JKL, and M,. keys.  This makes sense because it provides a 
physical arrangement of the numbers that would have felt familiar to someone who was used to
a tabulation machine. 

(_I believe the Cadetwriter has colored keycaps to denote the numerical 
keys, but from the pictures I've seen it doesn't look like the 1620 had this feature._)

# Connectors

Part of what is found on the two inches that were added to the bottom platform 
of the Model B typewriter is a set of giant 40-pin Elco connectors.  I think 
there are four: two for output and two for input. 

There is nothing compact/efficient
about these connectors: two pins for every key on the 
typewriter: one to generate the keystroke (output) and one to detect it (input). This is the ultimate parallel port.

One less obvious thing to note: two pins on the output connector 
provide access to the various "interlock"
mechanisms. Continuity is provided between these two pins when **none** of the
interlocks are engaged. In other words, any of the following breaks 
continuity:
* Carriage return in process
* Tab in process
* Space in process 
* Shift engage/shift release in process
* Character typing in process

So the CPU can watch all of these things with one connection. When
there is continuity through this loop it's safe to send the 
next character.

All of the interfaces to the typewriter use 48 volts. This is likely 
a result of the fact that the actuators need a fair amount of pull
to do their jobs.  From the specifications, the actuators draw 
around 200mA a piece, which is a significant current.

# Notes on Simulation

I am going to stay as true to the original electronics as possible.
In an ideal world it will be possible to integrate directly with 
a Model B. :-) I've been watching Craigslist and there are some tempting
vintage IBM typewriters for sale. But my family already thinks I'm insane.

In reality, I'll need to convert the signals on
the 40-pin connectors to a "normal" terminal interface of some kind.  
It would probably be possible to make a interface card for the 
Cadetwriter.  
