---
title: Notes on Linux Boot
date: 2025-12-30
---

## UEFI

Unified Extensible Firmware Interface (UEFI) is a specification for the firmware architecture of a computing platform. The standard is open but the implementations are generally proprietary.

The actual boot order, which tells the UEFI where to look (e.g., which disk, which partition, which bootloader file), is stored in the motherboard's Non-Volatile RAM (NVRAM). 

## ESP

The UEFI ESP (EFI System Partition) is a small, mandatory FAT32 partition on storage drives that holds boot loaders, drivers, and utilities for computers using the Unified Extensible Firmware Interface (UEFI) to start the operating system.

The ESP is a dedicated OS-independent partition, allowing multiple operating systems (like Windows and Linux) to coexist on the same drive, each with its own boot files in the ESP or related locations.

It provides files for UEFI utilities and firmware updates, often mounted at /boot/efi in Linux. 

The ESP contains the .efi files that the UEFI firmware executes to start an operating system.

For Debian 12 (Bookworm) UEFI installs, the EFI System Partition (ESP) needs to be FAT32 formatted with a mount point of /boot/efi. While a minimum of 100-300 MB works, 500-1000 MB (1GB) is strongly recommended to comfortably handle multiple kernels, operating systems (dual-boot), and firmware updates without running out of space later, as resizing it can be difficult. 

## BOOTX64.EFI

Every device that can be booted, has an EFI System Partition (ESP) formatted with the FAT32 filesystem. The UEFI firmware is supposed to, at a minimum look for the file "\EFI\BOOT\BOOTX64.EFI" in every ESP and add that to the boot menu.  The UEFI firmware can also maintain other boot menu entries that refer to files in the EFI System Partitions, such as the familiar "\EFI\MICROSOFT\BOOT\BOOTMGFW.EFI".  

The UEFI firmware scans all EFI System Partitions for this specific path if no other boot options are set.

## Parition Setup

For new users, personal Debian boxes, home systems, and other single-user setups, a single / partition (plus swap) is probably the easiest, simplest way to go. The recommended partition type is ext4.

With respect to the issue of swap partition size, there are many views. One rule of thumb which works well is to use as much swap as you have system memory. It also shouldn't be smaller than 512MB, in most cases. Of course, there are exceptions to these rules. For hibernation to work you must have a swap space (partition or file) at least as large as your RAM to save your system's state.

## WYSE 3040 Notes

[An article related to the Wyse 3040](https://nickcharlton.net/posts/installing-debian-12-dell-wyse-3040).

The Wyse 3040 only uses UEFI and doesn’t support a legacy BIOS mode. 

This machine has a bug that involves its firmware's strict requirement to find bootloaders at the standard EFI/BOOT/BOOTX64.EFI fallback path, often failing with non-standard installations like Debian's default, causing boot failures or blank screens. 

Used the LxQt version of the Debian Live distro.

Added "nomodeset" from Grub menu in live install to address a blank screen issue. 

### Debian Setup of 3040

An 8Gb drive shows up as /dev/mmcblk0 df 

* Partition 1: 500MB, ESP
* Partition 2: 7GB, ext4, /
* Partition 3: ~500MB, swap

Selected: " Force extra installation to the EFI removable media path?" 

