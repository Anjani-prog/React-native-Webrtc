/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    TextInput,
    Button,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Image
} from 'react-native';

import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices,
} from 'react-native-webrtc';

import io from 'socket.io-client'
import HeadphoneDetection from 'react-native-headphone-detection';
import Video from './components/video'
import RNSwitchAudioOutput from 'react-native-switch-audio-output';
const dimensions = Dimensions.get('window')
class PrayerRoom extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            localStream: null,    // used to hold local stream object to avoid recreating the stream everytime a new offer comes
            remoteStream: null,    // used to hold remote stream object that is displayed in the main screen

            remoteStreams: [],    // holds all Video Streams (all remote streams)
            peerConnections: {},  // holds all Peer Connections
            selectedVideo: null,

            status: 'Please wait...',

            pc_config: {
                "iceServers": [
                    {
                        "url": 'stun:stun.l.google.com:19302'
                    },
                ]
            },

            sdpConstraints: {
                'mandatory': {
                    'OfferToReceiveAudio': true,
                    'OfferToReceiveVideo': true
                }
            },

            messages: [],
            sendChannels: [],
            disconnected: false,
            room: '',
            connect: false,
            camera: true,
            mic: true,
            serviceIP: '',
            isFront: true   // for flipping front and back cam
        }

        this.socket = null
    }

    componentDidMount() {
        HeadphoneDetection.addListener(data => {
            if (data.audioJack) {
                RNSwitchAudioOutput.switchAudioOutput(false)
            }
            else if (!data.audioJack) {
                RNSwitchAudioOutput.switchAudioOutput(true)
            }
        });
    }

    componentWillUnmount() {
        if (HeadphoneDetection.remove) { // The remove is not necessary on Android
            HeadphoneDetection.remove();
        }
    }
    getLocalStream = () => {
        const success = (stream) => {
            console.log('localStream... ', stream.toURL())
            this.setState({
                localStream: stream
            })
            //  while join in  room add the current user to online users
            this.whoisOnline()
        }

        const failure = (e) => {
            console.log('getUserMedia Error: ', e)
        }


        mediaDevices.enumerateDevices().then(sourceInfos => {
            let videoSourceId;
            for (let i = 0; i < sourceInfos.length; i++) {
                const sourceInfo = sourceInfos[i];
                if (sourceInfo.kind == "videoinput" && sourceInfo.facing == (this.state.isFront ? "front" : "environment")) {
                    videoSourceId = sourceInfo.deviceId;
                }
            }

            const constraints = {
                audio: true,
                video: {
                    mandatory: {
                        minWidth: 500, // Provide your own width, height and frame rate here
                        minHeight: 300,
                        minFrameRate: 30
                    },
                    facingMode: (this.state.isFront ? "user" : "environment"),
                    optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
                }
            }

            mediaDevices.getUserMedia(constraints)
                .then(success)
                .catch(failure);
        });
    }

    whoisOnline = () => {
        // let all peers know I am joining
        this.sendToPeer('onlinePeers', null, { local: this.socket.id })
    }

    sendToPeer = (messageType, payload, socketID) => {
        this.socket.emit(messageType, {
            socketID,
            payload
        })
    }

    createPeerConnection = (socketID, callback) => {

        try {
            let pc = new RTCPeerConnection(this.state.pc_config)

            // add pc to peerConnections object
            const peerConnections = { ...this.state.peerConnections, [socketID]: pc }
            this.setState({
                peerConnections
            })

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    this.sendToPeer('candidate', e.candidate, {
                        local: this.socket.id,
                        remote: socketID
                    })
                }
            }

            pc.oniceconnectionstatechange = (e) => {

            }

            pc.onaddstream = (e) => {
                debugger

                let _remoteStream = null
                let remoteStreams = this.state.remoteStreams
                let remoteVideo = {}


                // 1. check if stream already exists in remoteStreams
                // const rVideos = this.state.remoteStreams.filter(stream => stream.id === socketID)

                remoteVideo = {
                    id: socketID,
                    name: socketID,
                    stream: e.stream,
                }
                remoteStreams = [...this.state.remoteStreams, remoteVideo]

                this.setState(prevState => {

                    // If we already have a stream in display let it stay the same, otherwise use the latest stream
                    // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
                    const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.stream }

                    // get currently selected video
                    let selectedVideo = prevState.remoteStreams.filter(stream => stream.id === prevState.selectedVideo.id)
                    // if the video is still in the list, then do nothing, otherwise set to new video stream
                    selectedVideo = selectedVideo.length ? {} : { selectedVideo: remoteVideo }

                    return {
                        // selectedVideo: remoteVideo,
                        ...selectedVideo,
                        // remoteStream: e.streams[0],
                        ...remoteStream,
                        remoteStreams, //: [...prevState.remoteStreams, remoteVideo]
                    }
                })
            }

            pc.close = () => {
                // alert('GONE')
            }

            if (this.state.localStream) {
                pc.addStream(this.state.localStream)
            }
            // return pc
            callback(pc)

        } catch (e) {
            console.log('Something went wrong! pc not created!!', e)
            // return;
            callback(null)
        }
    }


    joinRoom = () => {


        this.setState({
            connect: true,
        })

        const room = this.state.room || ''

        this.socket = io.connect(
            this.state.serviceIP + '/webrtcPeer',
            {
                path: '/io/webrtc',
                query: {
                    room: `/${room}`, //'/',
                }
            }
        )

        this.socket.on('connection-success', data => {

            this.getLocalStream()

            console.log(data.success)
            const status = data.peerCount > 1 ? `Total Connected Persons to room ${this.state.room}: ${data.peerCount}` : this.state.status

            this.setState({
                status,
                messages: data.messages
            })
        })

        this.socket.on('joined-peers', data => {

            this.setState({
                status: data.peerCount > 1 ? `Total Connected Persons to room ${this.state.room}: ${data.peerCount}` : 'Waiting for other Persons to connect'
            })
        })

        this.socket.on('peer-disconnected', data => {
            console.log('peer-disconnected', data)

            const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== data.socketID)

            this.setState(prevState => {
                // check if disconnected peer is the selected video and if there still connected peers, then select the first
                const selectedVideo = prevState.selectedVideo.id === data.socketID && remoteStreams.length ? { selectedVideo: remoteStreams[0] } : null

                return {
                    // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
                    remoteStreams,
                    ...selectedVideo,
                    status: data.peerCount > 1 ? `Total Connected Persons to room ${this.state.room}: ${data.peerCount}` : 'Waiting for other Persons to connect'
                }
            }
            )
        })

        this.socket.on('online-peer', socketID => {
            debugger
            console.log('connected peers ...', socketID)

            // create and send offer to the peer (data.socketID)
            // 1. Create new pc
            this.createPeerConnection(socketID, pc => {
                // 2. Create Offer
                if (pc) {

                    // Send Channel
                    const handleSendChannelStatusChange = (event) => {
                        console.log('send channel status: ' + this.state.sendChannels[0].readyState)
                    }

                    const sendChannel = pc.createDataChannel('sendChannel')
                    sendChannel.onopen = handleSendChannelStatusChange
                    sendChannel.onclose = handleSendChannelStatusChange

                    this.setState(prevState => {
                        return {
                            sendChannels: [...prevState.sendChannels, sendChannel]
                        }
                    })

                    // Receive Channels
                    const handleReceiveMessage = (event) => {
                        const message = JSON.parse(event.data)
                        console.log(message)
                        this.setState(prevState => {
                            return {
                                messages: [...prevState.messages, message]
                            }
                        })
                    }

                    const handleReceiveChannelStatusChange = (event) => {
                        if (this.receiveChannel) {
                            console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
                        }
                    }

                    const receiveChannelCallback = (event) => {
                        const receiveChannel = event.channel
                        receiveChannel.onmessage = handleReceiveMessage
                        receiveChannel.onopen = handleReceiveChannelStatusChange
                        receiveChannel.onclose = handleReceiveChannelStatusChange
                    }

                    pc.ondatachannel = receiveChannelCallback


                    pc.createOffer(this.state.sdpConstraints)
                        .then(sdp => {
                            pc.setLocalDescription(sdp)

                            this.sendToPeer('offer', sdp, {
                                local: this.socket.id,
                                remote: socketID
                            })
                        })
                }
            })
        })

        this.socket.on('offer', data => {
            this.createPeerConnection(data.socketID, pc => {
                pc.addStream(this.state.localStream)

                // Send Channel
                const handleSendChannelStatusChange = (event) => {
                    console.log('send channel status: ' + this.state.sendChannels[0].readyState)
                }

                const sendChannel = pc.createDataChannel('sendChannel')
                sendChannel.onopen = handleSendChannelStatusChange
                sendChannel.onclose = handleSendChannelStatusChange

                this.setState(prevState => {
                    return {
                        sendChannels: [...prevState.sendChannels, sendChannel]
                    }
                })

                // Receive Channels
                const handleReceiveMessage = (event) => {
                    const message = JSON.parse(event.data)
                    console.log(message)
                    this.setState(prevState => {
                        return {
                            messages: [...prevState.messages, message]
                        }
                    })
                }

                const handleReceiveChannelStatusChange = (event) => {
                    if (this.receiveChannel) {
                        console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
                    }
                }

                const receiveChannelCallback = (event) => {
                    const receiveChannel = event.channel
                    receiveChannel.onmessage = handleReceiveMessage
                    receiveChannel.onopen = handleReceiveChannelStatusChange
                    receiveChannel.onclose = handleReceiveChannelStatusChange
                }

                pc.ondatachannel = receiveChannelCallback
                debugger
                pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
                    // 2. Create Answer
                    pc.createAnswer(this.state.sdpConstraints)
                        .then(sdp => {
                            pc.setLocalDescription(sdp)

                            this.sendToPeer('answer', sdp, {
                                local: this.socket.id,
                                remote: data.socketID
                            })
                        })
                })
            })
        })

        this.socket.on('answer', data => {
            // get remote's peerConnection
            const pc = this.state.peerConnections[data.socketID]
            // console.log(data.sdp)
            pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => { })
        })

        this.socket.on('candidate', (data) => {
            // get remote's peerConnection
            const pc = this.state.peerConnections[data.socketID]

            if (pc)
                pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        })
    }

    switchVideo = (_video) => {
        debugger
        // alert(_video)
        this.setState({
            selectedVideo: _video
        })
    }

    stopTracks = (stream) => {
        stream.getTracks().forEach(track => track.stop())
    }

    render() {
        const {
            localStream,
            remoteStreams,
            peerConnections,
            room,
            connect,
        } = this.state

        // debugger
        const remoteVideos = remoteStreams.map((rStream, index) => {
            return (
                <TouchableOpacity key={index} onPress={() => this.switchVideo(rStream)}>
                    <View
                        style={{
                            flex: 1,
                            width: '100%',
                            backgroundColor: 'black',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 2,
                        }}>
                        <Video
                            key={2}
                            mirror={true}
                            style={{ ...styles.rtcViewRemote }}
                            objectFit='contain'
                            streamURL={rStream.stream}
                            type='remote'
                        />
                    </View>
                </TouchableOpacity>
            )
        })
        const remoteVideo = this.state.selectedVideo ?
            (
                <Video
                    key={2}
                    mirror={true}
                    style={{ width: dimensions.width, height: dimensions.height / 2, }}
                    objectFit='cover'
                    streamURL={this.state.selectedVideo && this.state.selectedVideo.stream}
                    type='remote'
                />
            ) :
            (
                <View style={{ padding: 15, }}>
                    <Text style={{ fontSize: 22, textAlign: 'center', color: 'white' }}>Waiting for Others to join ...</Text>
                </View>
            )

        if (!connect)
            return (
                <View style={{
                    flex: 1,
                    paddingHorizontal: 10,
                    paddingVertical: Dimensions.get('screen').height / 5
                }}>
                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        marginVertical: 10,
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: 'black',
                            fontWeight: 'bold'
                        }}>Enter Room ID:</Text>
                        <TextInput
                            style={{
                                height: 40,
                                width: '60%',
                                borderColor: 'green',
                                borderWidth: 1,
                                borderRadius: 5,
                                marginHorizontal: 15,
                            }}
                            textAlign={'center'}
                            onChangeText={text => this.setState({ room: text })}
                            value={this.state.room}
                        />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        marginVertical: 10,
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: 'black',
                            fontWeight: 'bold'
                        }}>Enter URL:</Text>
                        <TextInput
                            style={{
                                height: 40,
                                width: '70%',
                                borderColor: 'green',
                                borderWidth: 1,
                                borderRadius: 5,
                                marginHorizontal: 15,
                            }}
                            textAlign={'center'}
                            onChangeText={text => this.setState({ serviceIP: text })}
                            value={this.state.serviceIP}
                        />
                    </View>
                    <Button
                        disabled={this.state.serviceIP?.length === 0 ? true : false}
                        title="Join/Create Room"
                        onPress={this.joinRoom}
                    />
                </View>)

        const videoActionButtons = (
            <View style={{
                ...styles.buttonsContainer,
                justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: 15
            }}>

                <TouchableOpacity
                    onPress={() => {
                        debugger
                        const videoTrack = localStream.getTracks().filter(track => track.kind === 'video')
                        videoTrack[0].enabled = !videoTrack[0].enabled
                        this.setState({
                            camera: videoTrack[0].enabled
                        })
                    }}>
                    <Image
                        style={styles.tinyLogo}

                        source={this.state.camera && require('../assets/images/video-camera.png') || require('../assets/images/video-camera-off.png')}
                    />
                </TouchableOpacity>
                {/* <TouchableOpacity
                    onPress={() => {
                        RNSwitchAudioOutput.switchAudioOutput(true)
                    }}>
                    <Text>SpeakerOn</Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                    onPress={() => {
                        debugger
                        const audioTrack = localStream.getTracks().filter(track => track.kind === 'audio')
                        audioTrack[0].enabled = !audioTrack[0].enabled
                        this.setState({
                            mic: audioTrack[0].enabled
                        })
                    }}>
                    <Image
                        style={styles.tinyLogo}
                        resizeMode='contain'
                        source={this.state.mic && require('../assets/images/microphone.png') || require('../assets/images/microphone-off.png')}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ backgroundColor: 'red', width: 'auto', paddingHorizontal: 5 }}
                    onPress={() => {
                        // disconnect socket
                        this.socket.close()

                        // localStream.stop()
                        this.stopTracks(localStream)

                        // stop all remote audio & video tracks
                        remoteStreams.forEach(rVideo => this.stopTracks(rVideo.stream))

                        // stop all remote peerconnections
                        peerConnections && Object.values(peerConnections).forEach(pc => pc.close())

                        this.setState({
                            connect: false,
                            peerConnections: {},
                            remoteStreams: [],
                            localStream: null,
                            remoteStream: null,
                            selectedVideo: null,
                        })
                    }}>
                    <Text style={{ color: 'white' }}>Exit</Text>
                </TouchableOpacity>

            </View>
        )

        return (

            <SafeAreaView style={{ flex: 1, }}>
                <StatusBar backgroundColor='transparent' barStyle={'dark-content'} />

                {videoActionButtons}


                <View style={{ ...styles.videosContainer, }}>
                    <View style={{
                        position: 'absolute',
                        zIndex: 1,
                        top: 10,
                        right: 10,
                        width: 100,
                        // height: 150,
                        backgroundColor: 'black', //width: '100%', height: '100%'
                    }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={() => localStream._tracks[1]._switchCamera()}>
                                <View>
                                    <Video
                                        key={1}
                                        zOrder={0}
                                        objectFit='cover'
                                        style={{ ...styles.rtcView }}
                                        streamURL={localStream}
                                        type='local'
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View
                        onPress={() => alert('hello')}
                        style={{
                            flex: 1,
                            width: '100%',
                            backgroundColor: 'black',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {remoteVideo}
                    </View>
                    <ScrollView horizontal={true} style={{ ...styles.scrollView }}>
                        {remoteVideos}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }
};

const styles = StyleSheet.create({
    buttonsContainer: {
        flexDirection: 'row',
        backgroundColor: "white"
    },
    tinyLogo: {
        width: 25,
        height: 25,
    },
    button: {
        margin: 5,
        paddingVertical: 10,
        backgroundColor: 'lightgrey',
        borderRadius: 5,
    },
    textContent: {
        fontFamily: 'Avenir',
        fontSize: 20,
        textAlign: 'center',
    },
    videosContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    rtcView: {
        width: 100, //dimensions.width,
        height: 150,//dimensions.height / 2,
        backgroundColor: 'black',
        borderRadius: 5,
    },
    scrollView: {
        position: 'absolute',
        zIndex: 0,
        bottom: 10,
        right: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    rtcViewRemote: {
        width: 110, //dimensions.width,
        height: 110, //dimensions.height / 2,
        borderRadius: 5,
    }
});

export default PrayerRoom;
