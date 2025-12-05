---
title: Thoughts on AllStarLink Firewall Traversal 
date: 2025-12-05
---

I've been deep into the details of AllStarLink and have nearly
completed my no-Asterisk-strings-attached implementation. This has been a 
great learning experience. This is actually the second time I've embarked
on a crazy project like this, the previous time was [my implementation of EchoLink](https://github.com/brucemack/microlink). 

I've been working on putting the [Wellesley Amateur Radio Society (W1TKZ)](https://ema.arrl.org/wellesley-amateur-radio-society/) repeater system on AllStarLink using a 4G/LTE cellular hotspot.
I've never worked much with the mobile carriers so a lot of this is new to me. In particular,
the hotspot that I am using (Verizon + Netgear LM1200) provides generally good service, but
has the limitations of CGNAT on the IPv4 side. Bottom line: it's not easy to accept inbound 
connections since (a) you don't have a static IP address and (b) the port numbers are NATed
and (c) there's a rigid firewall with no concept of "port forwarding rules" like you might 
have from a commercial or home ISP.

That said, the story on the IPv6 side is much better. I think robust support for IPv6 in AllStarLink is the best way to get away from the limitations
of the CGNAT world. With IPv6 **there is no translation of addresses or ports** - you get "real" 
internet addresses/ports all the way down to the AllStarLink end-point. My implementation of
IAX2 now supports IPv6 and it works well, with some important limitations. I'll provide a different write-up on that later.

However, the problem isn't solved. The inflexible firewall still exists and the Verizon 4G/LTE 
service doesn't allow ports to be opened from the outside world. For obvious reasons, the carriers designed the mobile network to support clients, not servers. So even if everything was 
running on IPv6, making a call into the node at our repeater site is still blocked.

All of this reminded me of something from my EchoLink experience. I know people might quarrel 
with this, but from my perspective the AllStarLink and EchoLink systems are **very similar** 
from a technology standpoint. Both essentially borrow concepts/protocols from the VOIP/PBX world
and adapt them for ham radio use. Each system has its pros and cons. One of the big pros
of EchoLink it its smooth(er) traversal of firewalls. I think the AllStarLink system can 
borrow a proven technique from EchoLink.

Adapting the EchoLink OPEN/OVER Protocol
========================================

If you want to know how the EchoLink system works, [my reverse-engineering document](https://github.com/brucemack/microlink/blob/main/docs/el_supplement.md) may be
the most detailed source of information. EchoLink doesn't enjoy an nice [RFC like IAX2](https://datatracker.ietf.org/doc/html/rfc5456). 

EchoLink has a central server called the "Addressing Server" that 
plays a similar role to the AllStarLink registration server. One simple feature in the EchoLink Addressing Server makes firewall traversal simpler. I call this 
feature the ["OPEN/OVER protocol"](https://github.com/brucemack/microlink/blob/main/docs/el_supplement.md#echolink-pingopenover-protocol). 

Understanding this mechanism requires an understanding of dynamic firewall capabilities known as [Stateful Packet Inspection](https://en.wikipedia.org/wiki/Stateful_firewall) and/or [UDP Hole Punching](https://en.wikipedia.org/wiki/UDP_hole_punching). A full explanation is beyond the scope of this document, but the key thing to understand is: on most "normal" home/cellular internet routers sending a UDP packet to a remote address will **automatically grant temporary permission for the return path**. This temporary permission is sometimes called a "UDP hole" because it enables a traffic pattern that would not normally be possible. The hole being described here includes (a) a firewall opening to allow return traffic on the same port and (b) the routing entries needed to get the return traffic back to the right place on your LAN. Without this hole, two-way communication would not be possible.

The UDP hole is transient and will only persist as long as the network path is actively being used. Once a path becomes inactive the UDP hole is closed. The lifetime of the hole depends 
on the carriers and the traffic situation, but it's safe to assume that the holes will last through 15 seconds of inactivity.

If node 44444 (from port 4569) wants to connect to node 55555 (to port 4569) it will be blocked by the firewall. However, if node 55555 _just happens_ to send a message to node 44444 on the same ports, a 
temporary opening will be created on node 55555's firewall for a short time. If node 44444 wants to 
connect to node 55555 during that window, the packets go through just fine.

So, the "trick" is to ask node 55555 to make a brief (and content-free) connection to node 44444 in 
advance of receiving a real call from node 44444. EchoLink performs this trick by leveraging their 
addressing server.  AllStarLink could do the same thing, something like this:

1. Node 55555 sends a POKE frame (on port 4569) to the Registration Server on a regular basis.
This has the effect of keeping a UDP hole open on 55555's firewall for packets **FROM** the Registration 
Server.
2. When node 44444 wants to call node 55555, it first sends a POKE frame to the Registration Server
with the IP address/port that it wants to connect to (i.e. 55555's address/port). 
3. After authentication (likely PKI), the Registration Server uses it's open path to 55555 to 
send a POKE frame telling it of node 44444's interest.
4. After another authentication, node 55555 sends a POKE frame directly to node 44444, thus establishing
a second UDP hole. 
5. Finally, node 44444 places the call leveraging the open path that was just created by the 
previous step. 
6. The ongoing call keeps the firewalls open in both directions.

To be clear: the Registration Server is not in the middle of the call - this is not a proxy mechanism.
The Registration Server is just acting as a notification service for nodes stuck behind 
restrictive firewalls.

Also, I don't think the Registration Server would need to perform any database access to support
this feature. A public-key encryption mechanism could be used to perform the necessary validations.

I'm specifically mentioning the IAX POKE frame type because that message is already in the IAX2
protocol and is designed for this kind of situation. From the RFC:

> A POKE message is sent to test connectivity of a remote IAX peer.  It
> is similar to a PING message, except that it MUST be sent when there
> is no existing call to the remote endpoint.  It MAY also be used to
> "qualify" a user to a remote peer, so that the remote peer can
> maintain awareness of the state of the user.  A POKE MUST have 0 as
> its destination call number.
>
> Upon receiving a POKE message, the peer MUST respond with a PONG
> message.

One nice thing about the POKE is that it is processed by Asterisk (a) without needing 
any authentication and (b) without needing an active call. I've tested this on 
several nodes on the existing network and they all respond with the PONG, as 
required by the RFC.

We would need to send a few IEs in the POKE messages to support this feature. Specifically:
* The authentication tokens would be required
* The POKE from 44444 to the Registration Server would need to contain the target address/port.
* The POKE from the Registration Server to 55555 would need to contain the source
address/port of the anticipated connection.


