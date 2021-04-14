import React, { useEffect, useRef, useState} from 'react'
import './App.css';

//material ui
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

//socket
import io from 'socket.io-client'
import Peer from 'simple-peer'

//connect to backend in development
// const socket = io.connect('<localhost:7></localhost:7>000') //development
const socket = io.connect('/')  // uncomment to proxy in nginx


function App() {
  //state
    const [ me, setMe ] = useState("")
    const [ users, setUsers ] = useState("")
    const [ stream, setStream ] = useState()
    //set name
    const [name, setName] = useState("")
    //set caller
    const [caller, setCaller] = useState("")
    //set caller signal
    const [callerSignal, setCallerSignal] = useState("")
    //is the call received?
    const [callAccepted, setCallAccepted] = useState(false)
    //is the call ended?
    const [ callEnded, setCallEnded] = useState(false)
    //incoming call
    const [incomingCall, setIncomingCall] = useState(false)


  //my video - (refs to video jsx)
  const myVideo = useRef()
  //other user video
  const userVideo = useRef()
  const connectionRef = useRef()
  
  //on initial load
  useEffect(() => {
    //browser prompot to use camera and microphone
    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream) => {
      setStream(stream) //assign stream to state
      myVideo.current.srcObject = stream
    })

    //on initial load, grab our socket id from backend
    socket.on('me', (id) => { 
      setMe(id) //assign id to state(me)
    })

    //users object from the backend
    socket.on('allUsers', (users) => {
      setUsers(users)
    })
    //set the state when a user calls
    socket.on('incomingCall', (data) => {
      console.log(data)
       //is the call accepted?
       setCallAccepted(true)
       //set the caller
       setCaller(data.from)
       //set the name of the caller
       setName(data.name)
       //set the callerSignal
       setCallerSignal(data.signal)
       setIncomingCall(true)
    })

  }, [])

  const callUser = (id) => {
    //simple-Peer
    const peer = new Peer({
      initiator: true,
      trickle: false, 
      stream: stream //stream passed from getUserMedia
    })

    peer.on('signal', (data) => { //once a handshake is made, emit callUser function
      // emit to callUser function in server.js with fields
      socket.emit('callUser', {
        userToCall: id,
        signalData: data, //data from simple peer connection
        from: me
      })
    })

    peer.on('stream', stream => { // incoming stream from other user after handshake
       userVideo.current.srcObject = stream //set stream to the userVideo
    })  

    socket.on("callAccepted", signal => {
      setCallAccepted(true)
      peer.signal(signal)
    })
    connectionRef.current = peer

  }
  

  const answerCall = () =>  {
    setCallAccepted(true)
    setIncomingCall(false)

    //new peer connection means new peer signal and new peer stream
    const peer = new Peer({
      initiator: false, //receiver of the call
      trickle: false,
      stream: stream
    })

    peer.on('signal', data => {
        socket.emit('acceptCall', { //send back to server
          signal: data,
          to: caller
      })
    })

    peer.on('stream', (stream) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()

  }
  
  return (
    <div className="App">
      <div className="video-container">
        <div className="my-video">{stream && <video ref={myVideo} muted autoPlay style={{width: "400px"}}/>}</div>
        <div className="user-video">{callAccepted && <video ref={userVideo} muted autoPlay style={{width: "400px"}}/>}</div>
        
      </div>
        <TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
      <div className="users">

        {Object.keys(users).map(key => {
          if (key === me) {
            return null;
          }
          return (
            <Button onClick={()=> callUser(key)}>{key} is online. Press to call.</Button>
            );
          })}
      </div>
        <div className="answerCall">
          
          {
            callAccepted && incomingCall ? (
              <div>
                <h1>{name} is calling...</h1>
                <Button onClick={answerCall}>ANSWER</Button>
              </div>
            ) : null
          }

        </div>
    </div>
  );
}

export default App;
