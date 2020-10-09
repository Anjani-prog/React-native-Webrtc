#  Web Real-Time Communication (WebRTC)

 (Refer - 

https://www.tutorialspoint.com/webrtc/webrtc_overview.htm )


 
- Powerful tool that can be used to infuse Real-Time Communications (RTC) capabilities into browsers and mobile applications.

- Allows to set up peer-to-peer connections to other web browsers quickly and easily.

- This technology doesn't need any plugins or third-party software.(all of this comes built-in-data loss, connection dropping, and NAT traversal)

- The WebRTC API includes media capture, encoding and decoding audio and video, transportation layer, and session management.


1) Media Capture - Detect the type of devices available & to get access to the camera and microphone of the user's device.

2)  Encoding and Decoding Audio and Video  - The process of splitting up video frames and audio waves into smaller chunks and compressing them. This algorithm is called codec.There are also many codecs inside WebRTC like H.264, iSAC, Opus and VP8.When two browsers connect together, they choose the most optimal supported codec between two users. Fortunately, WebRTC does most of the encoding behind the scenes.

3)  Transportation Layer - The transportation layer manages the order of packets, deal with packet loss and connecting to other users. Again the WebRTC API gives us an easy access to events that tell us when there are issues with the connection.

4) Session Management - The session management deals with managing, opening and organizing connections. This is commonly called signaling. If you transfer audio and video streams to the user it also makes sense to transfer collateral data. This is done by the RTCDataChannel API.
      
(Check Browser Compatibility - http://caniuse.com/#feat=rtcpeerconnection.)




 API for web developers − this layer contains all the APIs web developer needed, including RTCPeerConnection, RTCDataChannel, and MediaStrean objects.




Protocols & Description

1 WebRTC Protocols
WebRTC applications use UDP (User Datagram Protocol) as the transport protocol.

2 Session Description Protocol
The SDP is an important part of the WebRTC. It is a protocol that is intended to describe media communication sessions.

3 Finding a Route
In order to connect to another user, you should find a clear path around your own network and the other user's network. But there are chances that the network you are using has several levels of access control to avoid security issues.


4 Stream Control Transmission Protocol
With the peer connection, we have the ability to send quickly video and audio data. The SCTP protocol is used today to send blob data on top of our currently setup peer connection when using the RTCDataChannel object.


NAT stands for Network Address Translation. In general, it is the process used by routers to modify IP information by translating local IP addresses on a private subnet to public IP addresses typically assigned by an Internet service provider (ISP). They present a major challenge when attempting to establish direct connections between clients on a network.
There are four types of NATs present in today’s routers, presented in order from least restrictive to most restrictive:

Full cone

Address-restricted cone

Port-restricted cone (like address-restricted cone, but the restriction includes port numbers)

Symmetric


STUN stands for Session Traversal Utilities for NAT. It is a network protocol/packet format (IETF RFC 5389) used by NAT traversal algorithms to assist in the discovery of network environment details.

TURN stands for Traversal Using Relays around NAT. Like STUN, it is a network protocol/packet format (IETF RFC 5766) used to assist in the discovery of paths between peers on the Internet. It differs from STUN in that it uses a public intermediary relay to relay packets between peers.

ICE stands for Interactive Connectivity Establishment. It defines a technique that uses SDP, STUN, and TURN to discover a network path between peers on the Internet.


The Session Description Protocol (SDP) is a format for describing multimedia communication sessions for the purposes of session announcement and session invitation.Its predominant use is in support of streaming media applications, such as voice over IP (VoIP) and video conferencing. SDP does not deliver any media streams itself but is used between endpoints for negotiation of network metrics, media types, and other associated properties. The set of properties and parameters is called a session profile.



3 sections mainly - 
Session description,
Time description (mandatory),
Media description (optional)


Session description
    v=  (protocol version number, currently only 0)
    o=  (originator and session identifier : username, id, version number, network address)
    s=  (session name : mandatory with at least one UTF-8-encoded character)
    i=* (session title or short information)
    u=* (URI of description)
    e=* (zero or more email address with optional name of contacts)
    p=* (zero or more phone number with optional name of contacts)
    c=* (connection information—not required if included in all media)
    b=* (zero or more bandwidth information lines)
    One or more Time descriptions ("t=" and "r=" lines; see below)
    z=* (time zone adjustments)
    k=* (encryption key)
    a=* (zero or more session attribute lines)
    Zero or more Media descriptions (each one starting by an "m=" line; see below)



Time description (mandatory)
    t=  (time the session is active)
    r=* (zero or more repeat times)
Media description (optional)
    m=  (media name and transport address)
    i=* (media title or information field)
    c=* (connection information — optional if included at session level)
    b=* (zero or more bandwidth information lines)
    k=* (encryption key)
    a=* (zero or more media attribute lines — overriding the Session attribute lines)

WebRTC API

RTCPeerConnection
https://www.tutorialspoint.com/webrtc/webrtc_rtcpeerconnection_apis.htm


main entry point to the WebRTC API
helps us connect to peers, initialize connections and attach media streams 
manages a UDP connection with another user.


https://www.callstats.io/blog/2017/10/26/webrtc-product-turn-server]


const configuration = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };

var pc = RTCPeerConnection(configuration);  // to create a rtcpeerconnection

config argument contains at least on key, iceServers. It is an array of URL objects containing information about STUN and TURN servers, used during the finding of the ICE candidates.





MediaStream
https://www.tutorialspoint.com/webrtc/webrtc_media_stream_apis.htm

Modern browsers give a developer access to the getUserMedia API, also known as the MediaStream API. There are three key points of functionality 

1 ) It gives a developer access to a stream object that represent video and audio streams

2) It manages the selection of input user devices in case a user has multiple cameras or microphones on his device.

3) It provides a security level asking user all the time he wants to fetches stream





RTCDataChannel
https://www.tutorialspoint.com/webrtc/webrtc_rtcdatachannel_apis.htm

 - to create a channel coming from an existing RTCPeerConnection object
