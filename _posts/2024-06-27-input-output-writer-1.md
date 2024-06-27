---
layout: post
title:  "IBM 1620 - Input-Output Writer, Model B"
tag-name: ibm1620
categories: [ "ibm1620" ]
---

# Interesting Clock Feature

While studying the clock generation logic [as described in my last post](/ibm1620/2024/06/25/clocks-working.html), I was puzzled by an input signal called -S HOLD TR P1 that comes from 
page 01.64.12.1 way towards the back of volume 3 of Dave's ALD set. Normally you'd think of 
the system clock as a __driver__ of all computer activity, so seeing a logic input to the 
clock tree caught my 
attention. I'll get into this in more detail later, but the ALD page where this signal 
originates is called **I┘O CONTROL** and, among 
other things, it is defines the start of the integration with the I/O typewriter. 

Long story short: the 1620's system clock is stopped (completely) during I/O operations to allow 
the slow mechanical devices - including the humans in front of them - to do their jobs. You're screaming along at 1 MHz until one of the I/O instructions comes along, at which 
point you slam on the breaks and the entire machine is halted until that operation can finish. This 
is very strange by today's standard, but the concept of asynchronous I/O does not exist on 
the 1620. 

This revelation led me to examine the 20 or so ALD pages related to the I/O typewriter.  Those
pages are quite interesting, and unexpected in many ways. I _am not_ an IBM typewriter expert, 
nor have I done an extensive amount of research. I'm providing what I can discern from the circuits 
and documentation below. Anyone who knows more should drop me a line and 
I'd be glad to elaborate my post.

# Check out the Cadetwriter

Dave Babcock and team have done a lot of work [on an interesting project called the Cadetwriter](https://github.com/IBM-1620/Cadetwriter) that replicates a 1620-style I/O typewriter using a slightly less vintage, but sill satisfyingly mechanical IBM Wheelwriter typewriter from the 1980's.  

![Wheelwriter](/assets/images/cadetwriter-1.jpg)

The Cadetwriter provides a functional I/O simulation of the 1620 typewriter, including some cleverness 
around the font issues needed to obtain peculiar characters that were used in the 1620 days. However,
Cadetwriter doesn't attempt to replicate the 1620-era hardware.  In order to avoid re-hashing
any of the excellent work done by the Cadetwriter team, I'm going to focus my analysis/documentation
on the original 1620 hardware as much as possible. 

# The Original Model B

The 1620 documentation just calls it "The Typewriter" - not very exciting.  It doesn't seem 
to have a machine number 
like the sexier tape reader (1621), the tape punch (1624), or the card reader/punch (1622).  This is
perhaps related to the fact that The Typewriter was actually borrowed from the mainstream IBM 
product line and integrated into the 1620 console. "The Typewriter" is actually an IBM Model B
electric typewriter with an extensive set of modifications. The official name given 
in [this more recent IBM document of 1966](https://bitsavers.org/pdf/ibm/typewriter/model_b/540-0113-2_IBM_Input-Output_Writer_Model_B_Jan196df) is the **IBM Input-Output Writer, Model B**. That
sounds slightly more exciting, but not much.

![Model B](/assets/images/model-b-1.jpg)

In this post I'll just share a few things I've learned about the typewriter itself. The interface
hardware to the 1620 processor is a fascinating/complex topic that I'll write down later.  

# High-Level Description of the Modifications

Essentially, the Model B electric typewriter was modified to allow "remote control."  The changes
go into these categories:
* An electronic actuator was added to each key to allow output via remote "typing."
* An electronic sensor was added to each key to allow key strokes to be watched and recorded. This
clever idea was later taken by the KGB and used to place a bugged version of an IBM Selectric
[into the US embassy in Moscow](https://www.popularmechanics.com/military/a30370413/typewriter-bugging-cold-war/).
* A few internal functions of the carriage mechanism were instrumented to allow the internal status
of the typewriter to be monitored by the 1620 CPU.
* I'm not sure about this, but I suspect that some of the key caps were altered from the 
production Model B to provide R-S (Release and Start), Flag Mark, and Record Mark. Those
don't seem like general-purpose keys.

All of this added almost two inches to the bottom of the unit, but it looks like it sat in a depressed
area on the 1620 console desk so this didn't matter.

# Mechanical Realities

I found it helped a lot to understand the interface circuitry if I kept a few of the 
mechanical realities of the Model B electric typewriter in mind:

* It's called an electric typewriter, but these IBM typewriters are a marvel of mechanical 
engineering.  Refer to numerous YouTube tear-downs to see what I mean.
* The typewriter works at 10 characters per second.  Anything faster runs the risk of a 
jam.
* A normal letter key needs to be pressed for 25 milliseconds to make a complete impression
on the page.
* You might be used to the design of modern inkjet printer, or even an IBM Selectric typewriter 
which hold the paper fixed (at least horizontally) and moves the printing element 
across a line of text. The IBM Electrics of this era did the opposite: the printing element
was fixed and the paper was moved horizontally in something called a "carriage" under 
the control of an electric motor.
* Carriage function keys (carriage return, space, tab) require 39 milliseconds to initiate 
because they control a more complicated mechanism.
* Carriage return, tab, and space involve a rotating belt. The time it takes to complete these 
operations is variable. The typewriter has an internal mechanism called an "interlock" to 
prevent typing during carriage movement. This requires feedback to the integration electronics
since there is no concept of a "buffer" anywhere in this system. The computer needs to be kept in the 
loop to determine when these long-running carriage movements are complete.
* "Shift" is a mechanical operation that lifts an internal part of the typewriter 
called the "basket." This takes
90 milliseconds to activate and 115 milliseconds to deactivate. A "remote control" typist
needs to wait for the shift to engage before pressing the next character. (NOTE: 
I suspect this is the limiting
factor that leads to the 10 character per second output data rate.)
* Tab stops are created manually by the operator.
* Given how tabs work, there is no way to keep count of how many characters have been typed
on a line.  Therefore, an internal switch detects when the end of the line has been 
reached.  I'm assuming this 
was part of the normal Model B system, but this also needs to be fed back to the integration 
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