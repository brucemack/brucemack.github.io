---
layout: post
title:  "IBM 1620 - Input-Output Typewriter, Mechanics"
tag-name: ibm1620
categories: [ "ibm1620" ]
---

In a [previous post](/ibm1620/2024/06/27/input-output-writer-1.html) I talked about 
the Model B Electric Typewriter that served as the I/O device for the original 1620 models. In 
this post I'll start to get into the complex mechanics and electronics used by 
the 1620 to integrate with this typewriter. 

It's no surprise that the typewriter itself is a mechanical device. What was surprising 
to me is how much of the typewriter _interface_ is mechanical. The logic of the core 1620 
processor used a cutting-edge design constructed almost entirely from transistors. In 
contrast, the
typewriter interface is built from a bewildering collection of 
mechanical relays, motors, and cams. My guess is that either (a) this part of 
the system was designed before the SMS/transistor technology was firmly established or (b)
this part of the system was designed by the "typewriter team" who had deep expertise/history
building complex mechanical logic but was less comfortable with transistors. In seems that 
the 1620 typewriter control logic 
stands at the cross-roads between the legacy of IBM/CTR mechanical calculation/tabulation 
machines and the future of electronic computing.

The IBM document entitled ["Commutation and Control"](https://ed-thelen.org/comp-hist/IBM-FU-05-CommutationControl.pdf) provides the details of the IBM mechanical controls
used in a wide range of machines of the era. In this post I'll summarize the key concepts 
that are needed to understand how the 1620 typewriter interface works. Some of this 
is clear from the documentation, some takes some digging.

# Duo Relay 

This is the most common component used in the typewriter interface. The IBM documentation
refers to the basic relay as a "Duo Relay" for reasons that we'll get into shortly.

![Relay 1](/assets/images/relays-1a.jpg)

Most people are
familiar with the operation of a relay so I'll just highlight the facets that are 
most relevant to the 1620 design:
* The duo relays support multiple/parallel contact sets known as "stacks."  The picture above
shows two contact sets (1NC/1C/1NO and 2NC/2C/2NO). NC is "normally closed," OP is "common"
or "operating point" and NO is "normally open." The 1620 uses relays that have 
up tp 12 independent "stacks" controlled by one set of coils. 
* The relay is closed when the coils are energized. IBM uses the term "pick" to refer to the 
relay closing operation. 
* The term "duo" arises from an interesting feature that I've not seen before. Notice 
from the diagram above that 
there are two separate
coils provided for operating the relay.  The "pick" coil is designed to quickly close the relay, but 
requires more power.  The "hold" coil pulls in the same direction, but works more slowly and 
requires less power.  The difference
has to do with the type/amount of wire used to wind the coils. These circuits are designed
to energize the pick coil first to quickly close the relay, and then hand over to the hold 
coil to keep it closed for a longer period of time. Importantly, one of the two coils
must always be energized to keep the relay closed or else the spring will pull it open again.

The relay components are disaggregated in the 1620 schematics.

This part of the schematic shows two stacks of relay 3: stack 4 and stack 2. Notice each 
stack has three connections (NC/OP/NO). These two stacks are electrically independent,
except for the fact that they are controlled by the same two coils.

![Relay 1](/assets/images/relays-3.jpg)

Other stacks of the same relay may appear on completely different pages in the schematic.

This part of the schematic shows the two coils for relay 12.  The "P" indicates the pick
coil and the "H" indicates the hold coil. (NOTE: This particular example is unusual in that the 
two coils are wired in series - that defeats the purpose of the duo relay.)

![Relay 1](/assets/images/relays-2.jpg)

# Latching Relay

This is less common, but appears in some critical functions of the 1620. 

![Relay Latching](/assets/images/relays-4.jpg)

The key difference here 
is that the relay has no spring.  Once the "pick" coil is energized, the relay will stay 
 closed even when the current is removed from the coil.  IBM uses the term "trip" 
to refer to the opposite direction: once the "trip" coil is energized the relay opens again.  
There is 
no power required to maintain the closed or open state - only to transition.  This relay type is typically used to manage
long-lived states. 

There is no difference in the depiction of the contacts in the schematics.  The schematic
representation of the coils use "LP" to denote the pick coil and "LT" to denote the 
trip coil:

![Relay Latching](/assets/images/relays-5.jpg)

# Cam Operated Relays

This one took some time to figure out. The surprisingly complex timing sequences needed by the typewriter
interface are driven by a special type of rotating relay called a **cam-operated contact.**
In this device, a motor is used to turn a series of parallel cams to produce electrical 
continuity at different phases of each rotation. The precise phasing is achieved
by (a) machining the size of the cam to control the fraction of the rotation for which it
is engaged and (b) offsetting each cam relative to the others on the same drive shaft 
to determine the phase
of the engagement. This is very similar to the camshaft in a mechanically-controlled
engine.

This picture from the IBM documentation illustrates the mechanism:

![Cam Relay](/assets/images/relays-6.jpg)

The cam rotates in the clockwise direction. Notice that the relay contact is held 
open from approximately 110° around to approximately 360° and is 
allowed to close from 0° to 110°. The point where the relay closes
is called the "make angle" and the point where the relay opens is called the 
"break angle." A complicated machine like the IBM 1620 typewriter interface would
typically have several cams mounted on the same motor shaft, each sized and offset
differently to produce the desired timing pulses.

These devices show up in the 1620 schematic in a cryptic way that only makes 
sense when you understand the mechanics.  Here is an example:

![Cam Relay 1](/assets/images/relays-7.jpg)

"CRCB 4" is the 4th of 6 parallel cams mounted on the same motor shaft. M171 means 
that the relay is "made" (closed) at 171° of rotation and B221 means the relay
"break" is at 221°. If you do the math, this cam provides a repeating pulse with 
about a 14% duty cycle: (221 - 171) / 360.

Note in this example, when CRCB 4 is made we expect to see +48 volts on 
the operating point of stack 3 of relay 20.


Here we see CRCB 6, which is another instance of the same 50° cam part, but offset at 
a different phase relative to CRCB 4. This produces another 14% duty cycle pulse,
but offset from CRCB 4 by 139° in phase.

![Cam Relay 2](/assets/images/relays-8.jpg)

Hopefully you can see that this is the mechanical equivalent of the electronic 
clock sequence that was described in [my previous post about clocking](/ibm1620/2024/06/25/clocks-working.html).





