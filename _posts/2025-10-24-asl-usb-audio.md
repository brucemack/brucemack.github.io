---
title: Notes on AllStarLink USB Audio Interfaces
---
Random notes from study of the mechanisms involved.
Some of this is probably just general Linux USB knowledge.

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









References
==========

* [CM108 datasheet](https://www.micros.com.pl/mediaserver/info-uicm108b.pdf)
* [HID specification](https://www.usb.org/sites/default/files/documents/hid1_11.pdf)
* [USB Protocol Stuff](https://www.beyondlogic.org/usbnutshell/usb6.shtml)
* [An ALSA HOWTO from >25 years ago](https://tldp.org/HOWTO/Alsa-sound.html#toc6)
* [Another that is more PCM related](https://alsamodular.sourceforge.net/alsa_programming_howto.html)

