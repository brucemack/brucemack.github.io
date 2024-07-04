---
layout: post
title:  "IBM 1620 - Input-Output Mechanics"
tag-name: ibm1620
categories: [ "ibm1620" ]
---

In a [previous post](/ibm1620/2024/06/27/input-output-writer-1.html) I talked about 
the Model B Electric Typewriter that served as the I/O device for the original 1620 models. In 
this post I'll start to get into the complex electronics and mechanics used by 
the 1620 to integrate with this typewriter. 

It's no surprise that the typewriter itself is a mechanical device. What was surprising 
to me is how much of the typewriter _interface_ is mechanical. The logic of the core 1620 
processor used a cutting-edge design constructed almost entirely from transistors. In 
contrast, the
typewriter interface is built from a bewildering collection of 
mechanical arrays and selection commutators. My guess is that either (a) this part of 
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
in the closed even when the current is removed from the coil.  IBM uses the term "trip" 
to refer to the opposite direction: once the "trip" coil is energized the relay opens again.  
There is 
no power required to maintain the closed or open state - only to transition.  This relay type is typically used to manage
long-lived states. 

There is no difference in the depiction of the contacts in the schematics.  The schematic
representation of the coils use "LP" to denote the pick coil and "LT" to denote the 
trip coil:

![Relay Latching](/assets/images/relays-5.jpg)



