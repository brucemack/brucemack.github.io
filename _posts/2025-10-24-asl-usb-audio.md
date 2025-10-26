---
title: Notes on AllStarLink USB Audio Interfaces
---
Random notes from study of the mechanisms involved.
Some of this is probably just general Linux USB knowledge.

DSP Elements
============

## Upsampling in chan_simpleusb.c

(See [chan_simpleusb.c code](https://github.com/AllStarLink/app_rpt/blob/f8e4aee84bfeeb4c3acf3ccd2c1a0cdefaef1936/channels/chan_simpleusb.c#L2130)).

The USB audio devices are running at 48 kHz. The network audio runs at 8 kHz.
Network audio needs to be upsampled by a factor of 6. As per normal 
multi-rate technique, a low-pass filter needs to be applied after the 
8kHz sample has been copied 6 times. An FIR filter is used. The comment
says: "2900 Hz passband with 0.5 db ripple, 6300 Hz stopband at 60db."
The coefficients from the actual code are here:

```c
#define	NTAPS 31
static short h[NTAPS] = { 103, 136, 148, 74, -113, -395, -694,
        -881, -801, -331, 573, 1836, 3265, 4589, 5525, 5864, 5525,
        4589, 3265, 1836, 573, -331, -801, -881, -694, -395, -113,
        74, 148, 136, 103 };
```

After some experimentation, I can match these coefficients very closely
by assuming a 31-tap FIR filter with a cut-off of 4,300 Hz and a Kaiser
window with a beta of 3.0. Here are the plots of the two impulse responses
superimposed:

![LPF Analysis](/assets/images/asl-lpf-1.jpg)

Fixed-point math is used to apply this filters. Input audio is 16-bit (signed)
PCM and the coefficients are 16-bit signed values.  After the convolution 
of the PCM audio and the taps is completed a final >>15 operation is performed
to keep the scaling right.

## Downsampling in chan_simpleusb.c

The appears to use exactly the same LPF design as the upsampling filter.

## CTCSS Filtering HPF

This appears in hpass6() and is selectively enabled. The goal is to strip 
the sub-audible CTCSS tone from the audio input.  From the comment in the
code this is an "IIR 6 pole High pass filter, 300 Hz corner with 0.5 db ripple."

Taking the coefficients from the code and putting them into the customary 
Direct Form I ("b/a") format used for IIR filters gives this:

b = [0.5727761454663172, -3.4366568727979034, 8.591642181994757, -11.455522909326344, 
8.591642181994757, -3.4366568727979034, 0.5727761454663172 ]
a = [1.0, -4.86645111, 9.98966956, -11.06859818, 6.99051266, -2.39325566, 0.34918616 ]

* Note the "gain" variable in the code that was used to adjust the b coefficients.
* Watch out for the sign convention on the a coefficients. The coefficients shown
above are the negatives of what is actually in the code to adhere to the standard form.

These parameters match exactly with what comes out when we synthesize a 
Chebyshev filter using the scipy.signal.cheby1() function using fc=300 Hz and rp=0.5 dB.
The frequency response curves of the filter with the coefficients from chan_simpleusb.c
and the filter synthesized by SciPy are plotted below. The plots overlap perfectly:

![HPF Analysis](/assets/images/asl-hpf-1.jpg)

Linux Audio Interface (USB)
===========================


res_usbradio.c looks into this directory:

        /proc/asound/cards

Setting/Getting HID Register:

```c
void ast_radio_hid_set_outputs(struct usb_dev_handle *handle, unsigned char *outputs)
{
	usleep(1500);
	usb_control_msg(handle, 
        // Request Type 
        USB_ENDPOINT_OUT + USB_TYPE_CLASS + USB_RECIP_INTERFACE,
        // Request
        HID_REPORT_SET,
        // Value
        0 + (HID_RT_OUTPUT << 8), 
        // Index
        C108_HID_INTERFACE, 
        // Data
        (char *) outputs, 
        // Length
        4, 
        // Timeout
        5000);
}

void ast_radio_hid_get_inputs(struct usb_dev_handle *handle, unsigned char *inputs)
{
	usleep(1500);
	usb_control_msg(handle, 
        // Request Type 
        USB_ENDPOINT_IN + USB_TYPE_CLASS + USB_RECIP_INTERFACE,
        // Request
        HID_REPORT_GET,
        // Value
        0 + (HID_RT_INPUT << 8), 
        // Index
        C108_HID_INTERFACE, 
        // Data
        (char *) inputs, 
        // Size
        4, 
        5000);
}
```

```
int usb_control_msg(struct usb_device * dev, 
    __u8 request, 
    __u8 requesttype, 
    __u16 value, 
    __u16 index, 
    void * data, 
    __u16 size, 
    int timeout);
```

Get Request Type: 0b1010_0001 (0xA1), request: 0x01, value: 0x0100, index: 0x0003, length: 0x0004
Set Request Type: 0b0010_0001 (0x21), request: 0x09, value: 0x0200
#define C108_HID_INTERFACE	3

Understanding request parameter:

USB_ENDPOINT_OUT + USB_TYPE_CLASS + USB_RECIP_INTERFACE

From libusb docs:
* Bit 7: Data Transfer Direction (0 = Host to Device, 1 = Device to Host)
* Bit 6-5: Type (00 = Standard, 01 = Class, 10 = Vendor, 11 = Reserved)
* Bit 4-0: Recipient (00000 = Device, 00001 = Interface, 00010 = Endpoint, 00011 = Other)

* USB_ENDPOINT_OUT (0x00): A transfer from the host to the device.
* USB_ENDPOINT_IN (0x80): A transfer from the device to the host. 
* USB_TYPE_CLASS: corresponds to the value 0x01 << 5 (which is 0x20), meaning the bits 6 and 5 are set to 01. This signifies that the request is a class-specific request.
* USB_RECIP_INTERFACE (0x01): The request is directed at one of the device's interfaces. 

Understanding request parameter:

        HID_REPORT_SET - 0x09 0b0000_1001
        HID_REPORT_GET - 0x01 0b0000_0001

Understanding "value" parameter:

        0 + (HID_RT_OUTPUT << 8), 
        0 + (HID_RT_INPUT << 8), 

Possibly: HID_RT_INPUT = 0x01; HID_RT_OUTPUT = 0x02. So HID_RT_OUTPUT << 8 = 0x0100 and HID_RT_INPUT << 8 = 0x0200?

HID Experiments With USB Audio Box Containing a CM6206 
======================================================

This device is reported as "CM106 like" by the Linux kernel.

See CM106-F/L datasheet (page 18) https://pdf.dzsc.com/88888/20071017105428769.pdf.
Or CM6206 datasheet https://static6.arrow.com/aropdfconversion/93bbc7353fab6d53e77a2e0c6d577e23c048962d/cm6206_datasheet__v2.3.pdf

We are reading/writing /dev/hidraw0 in all cases, using normal Linux
open/read/write calls.

Per USB specification, numbers are represented in little-endian format.

### Test 1: Press/release mute button on control box. Output:

0x14, 0x00, 0x30 -> 0001 0100 | 0000 0000 | 0011 0000
0x10, 0x00, 0x30 -> 0001 0000 | 0000 0000 | 0011 0000

This shows the "mute" bit turning on/off (WORKING!).

### Test 2: Press/release volume down button. Output:

0x12, 0x00, 0x30
0x10, 0x00, 0x30

This shows the "VDN" bit turning on/off (WORKING!).

### Test 3: Generate a Set Output Report asking for the contents of 
register 1.

Send 48, 00, 00, 01.
Received 0x30, 0x00, 0x30 -> 0011 0000 | 0000 0000 | 0011 0000

From datasheet (page 19), this means PLLBINen=1 and SOFTMUTEen=1.

### Test 4: Read register 3.

Send 48, 0, 0, 3
Received: 0x30, 0x7F, 0x14

Full register 3 contents: 0001 0100 0111 1111


USB Audio Experiments 
=====================

Looking in /dev/snd. The naming convention pcmCxDy or controlCxDy indicates the 
card number (x) and device number (y) for a specific sound card. "p" for playback,
"c" for capture.

References
==========

* [CM108 datasheet](https://www.micros.com.pl/mediaserver/info-uicm108b.pdf)
* [HID specification](https://www.usb.org/sites/default/files/documents/hid1_11.pdf)
* [USB Protocol Stuff](https://www.beyondlogic.org/usbnutshell/usb6.shtml)
* [An ALSA HOWTO from >25 years ago](https://tldp.org/HOWTO/Alsa-sound.html#toc6)
* [Another that is more PCM related](https://alsamodular.sourceforge.net/alsa_programming_howto.html)
* [Part 1 of an article about how to build an Asterisk Channel Driver (highly relevant)](https://www.asterisk.org/building-a-channel-driver-part-1/)
* [Part 2](https://www.asterisk.org/building-a-channel-driver-part-2/)
* [Part 3](https://www.asterisk.org/building-a-channel-driver-part-3/)
