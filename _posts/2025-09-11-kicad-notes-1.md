---
title: PCB Layout Notes, KiCad
description: Notes on KiCad
---
Thermal Relief
==============

The connection between SMD pads and copper fills has an important nuance called
"thermal relief." The idea here is to provide the desired electrical connection between 
the pad and the copper fill while *minimizing the amount of thermal mass hanging on the 
pad*. The thermal mass of a pad very much affects the ability to solder on the pad. Pads
with excessively large thermal mass will pull heat away from the desired contact point, 
leading to poor/cold joints.

Notice here that KiCad connects the large red ground pad (pin 2) to the red copper
zone using a thin connections called "spokes," instead of just allowing the copper
zone to surround/touch the pad. 

![Thermal Relief](/assets/images/thermal-1.jpg)

KiCad will attempt to use 4 spokes when connecting
a pad to a zone during the zone fill process, but other constraints may get in 
the way and result in a smaller number of spokes being realized.

The thermal relief feature doesn't directly relate to PCB fab design rules, as far 
as I can tell. The fab would be fine having the pour zones touch the pads on the same layer.
This whole issue is related to manufacturabilty. (So it might matter for PCBA DRC)

There are a few KiCad settings that impact the thermal spoke generation behavior:
* In the Tools ... Zone Manager dialog, see the "Thermal spoke width" that controls
how wide the spoke that connects the pad to the zone should be.
* In the Tools ... Zone Manager dialog, see the "Thermal relief gap" that controls
how far the pad should normally be separated from the zone (i.e. aside from the spokes).
This gap marked with a blue arrow on the diagram above.
* In the File ... Board Setup dialog, see the "Minimum thermal relief spoke count" 
establishes a design rule for the number of spokes that are required. This is generally
set to 2. This setting doesn't impact spoke-generation per-se, but it is important
during the DRC process.

In the picture above, a DRC error is generated because the ground pad is only connected
to the pour zone through a single spoke. A manual trace will need to be added if the 
design rule requires at least two spokes. Interestingly, KiCad doesn't seem to care 
if the manually-added trace fully overlaps the existing spoke, which is strange because
this doesn't seem to be changing anything on the actual board. It appears that the 
presence of an explicit trace may turn off the spoke counting rule completely.

