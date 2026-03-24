---
title: Notes on STM32 Serial Bootloader
date: 2026-03-17
---

Can be accessed using RST and BOOT0. BOOT1 tied to GND. BOOT0=1 means boot from system (ROM) memory,
which contains the serial bootloader. BOOT0=0 means boot from flash.

* [STM Application Note AN2606 - General Information About System Memory Boot Mode](https://www.st.com/resource/en/application_note/an2606-stm32-microcontroller-system-memory-boot-mode-stmicroelectronics.pdf)
* [STM Application Note AN3155 - USART Boot](https://www.st.com/resource/en/application_note/an3155-how-to-use-usart-protocol-in-bootloader-on-stm32-mcus-stmicroelectronics.pdf)

After restart from system memory the boot loader starts scanning for the magic symbol on 
various ports (including USART1).

The start byte "7F" is sent on the USART to activate the USART/UART bootloader. The bootloader responds with "7F 79" where "79" indicates we have now activated the USART/UART system bootloader. 

There are serial commands that can control the STM32.

