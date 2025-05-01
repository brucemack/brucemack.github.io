---
title: Notes on the 03962A Charge Controller
---
_Copyright (C) Bruce MacKinnon, 2025.  Contact info at bottom of the page for comments/corrections._

The 03962A module is a commodity charge controlker for charging batteries 
with Li-ion chemistry. It takes a voltage input from a USB micro plug or from a solar
panel around 5V (4.5V to 5.5V specified).

The important component on the module is a [TP4056A](https://grobotronics.com/images/companies/1/datasheets/TP4056%20Datasheet.pdf). 

The battery is expected to be something like a 18650, or some other
Li-ion 3.7V (nominal) cell. 

The output is directly from the battery. At full charge this can be 
up to 4.2V. This output is unregulated.

An [MCP1700-3302E](https://www.mouser.com/datasheet/2/268/MCP1700_Data_Sheet_20001826F-3442024.pdf) or other suitable LDO regulator is used to make 3.3V. This particular regulator has a max dropout margin of 350mV (typical is 178mV). So 
regulation is maintained as long as the batter voltage stays above 3.95v.
