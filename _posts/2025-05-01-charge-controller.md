---
title: Notes on the 03962A Charge Controller
---
_Copyright (C) Bruce MacKinnon, 2025.  Contact info at bottom of the page for comments/corrections._

The 03962A module is a commodity charge controller for charging batteries 
with Li-ion chemistry. It takes a voltage input from a USB micro plug or from a solar
panel around 5V (4.5V to 5.5V specified).

The important component on the module is a [TP4056A](https://grobotronics.com/images/companies/1/datasheets/TP4056%20Datasheet.pdf). 

The battery is expected to be something like a 18650, or some other
Li-ion 3.7V (nominal) cell. Connect the battery to the B+/B- terminals on the module.

The output (OUT+/OUT- terminals) comes directly from the battery. At full charge this can be 
up to 4.2V. This output is unregulated.

There is a "programming resistor" (R3 or R<sub>prog</sub>) that controls the charging current
default is 1.2K which provides a 1A rate, which should only be used for 1000mAh batteries. 
See the TP4056A datasheet for other values.

An [MCP1700-3302E](https://www.mouser.com/datasheet/2/268/MCP1700_Data_Sheet_20001826F-3442024.pdf) or other suitable LDO regulator is used to make 3.3V. This particular regulator has a max dropout margin of 350mV (typical is 178mV). So 
regulation is maintained as long as the battery voltage stays above 3.95v.

Top left LED (red) indicates charge in process.  Top right LED (blue) indicates that 
the battery is fully charged.

**NOTE**: Documentation indicates that load should be disconnected during charging.


