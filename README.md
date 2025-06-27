# local_sync
What you find in this directory is what you need to host local (almost) synced video playback from Windows to your local network/hotspot.
<br/>
There are two different versions of this project: A video version, where one main video is played and paused, or a clips version where multiple clips are played in succession with timed jumps to the next clip. Although, it is recommended to just use the clip version with a single clip instead of the video version.
<br/>
This one is the clip version.

## HOW TO USE
### First-Time Setup
If the server has already been set up for your network, skip to the [next part](#every-time-setup)
#### Installing everything
On a Windows device, (use the codelivered installer to install node.js or) get the most recent version from [nodejs.org](https://nodejs.org), and install node.js. Now open the server directory (`/src/` ) in Windows Explorer, Shift + Right Click and click _Open in Terminal_. Confirm that PowerShell is open by seeing 'PS' in front of the directory path. If you're still in command line, use `powershell` to open PowerShell. If you don't see a `node modules` folder and `package.json`, `package-lock.json`, or if you're unsure that the installation is valid, run the commands `npm init -y`, and `npm install express ws`. These can also be found in `setup.txt`. <br/>

#### Creating a certificate
If you don't have a valid certificate for your network, or you don't know what that is, (use the codelivered installer or) get the most recent version from [git-scm.com](https://git-scm.com/downloads) to install git. Then open the server directory (`/src/` ), use Shift + Right Click again, and click _Open Git Bash here_. Now, run `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365`. Before entering any info, find out your IPv4 address: use Win+R and run `cmd`, and in that window run `ipconfig`. Look for your IPv4 address. It should look something like `192.168.X.X`. Copy it. Now, back in the Git Bash window, you can choose to skip entering info by just pressing enter or just entering it. **Make sure to type in your IP address for _Common Name_**. After finishing, you will see `key.pem` and `cert.pem` files in your server directory.
#### Trusting the certificate
Make sure to fully trust the certificate on the device you want to show the video on. I will demonstrate the steps for iOS: <br/>
1. Access the `cert.pem` file from your iOS device (e.g. email it to yourself) and open it.
2. Open Settings and click on _Profile Downloaded_ or go to **General > VPN & Device Management > Your IP address**.
3. Click _Install_.
4. Go to **General > About > Certificate Trust Settings** and enable Full Trust for your certificate.

Congrats, you just trusted your own certificate! Now you can cache the video.
#### Configuring the server
You may open `config.json` to choose some options. The options visible are dependent on what version you currently have.

<br/> If you have the video version:
* `videoUrl`: The name of the video file. Default is `video.mp4`

If you have the clip version:
* `clipsPath`: The directory of the clips. Default is `clips/`
* `initialClipIndex`: The name (index) of the first clip.
* `finalClipIndex`: The name (index) of the last clip.

On all versions:
* `port`: The port of your local server. Important when connecting
* `showDebug`: When `true`, shows a green debug overlay on the client page.
* `useDocumentOverVideoFullscreen`: Make the whole webpage go into Fullscreen instead of the video. Pros: Controls don't show when tapping the video or switching clips, Cons: Some iOS UX still visible.
* `useSyncingLogic`: Tries to sync the video playback as accurately as possible. A bit broken though, normal delay is < 0.5s.

Then, place your video file in the public directory, or your clips titled 0.mp4, 1.mp4 (honoring your `initalClipIndex` and `finalClipIndex`) in your clips directory.

### Every time Setup
Once you've got everything set up, you're ready to start the server.
#### Starting the Server
Open PowerShell in the server directory (`/src/` ) again and run `node server.js`. This window will be your running server log. If you see `Server running on port X`, you're good to go.
#### Connecting to the Server.
Once you're ready, you can open `https://192.168.X.X:PORT/control.html` (make sure to include the `https://`) on your windows device. You don't need to have a trusted certificate here. From this page, you will control the playback of the client devices. **Always open this page first**. <br/>
If you're using a LAN cable, make sure to disable the adapter and use WiFi. (**Settings > Network & Internet > Advanced network settings** and press disable on your LAN adapter).
<br/><br/>
On your client device, you can open `https://192.168.X.X:PORT/client.html` (again, use `https://`). Wait a maximum of a minute and the video along with some important execution files will have cached.
#### Preparing for playback
If you're using the sync logic, press _Test Seek Latency_ on the control page and after waiting a few seconds, pause and seek the beginning (0s). It is recommended to have ~1 second of black screen at the beginning of your video when using the sync logic. Now just tap on the webpage and it will open in Fullscreen.
### Using the playback
Once you've finished the setup, you can just press _Play_ on the control page and the videos will start on all client devices. Note that this has a small delay due to connectivity latency. The Buttons work as follows:
* _Play_: Start the video asynchronously on all devices.
* _Pause_: Pause the video asynchronously on all devices.
* (ONLY VIDEO) _Restart_: Set video progress to zero for all devices.
* (ONLY CLIPS) _First_: Switch to the first clip on all devices.
* (ONLY CLIPS) _Next_: Switch to the next clip on all devices, except if current clip index is `finalClipIndex`
* (ONLY CLIPS) _Prev_: Switch to the previous clip on all devices, except if current clip index is `initialClipIndex`
* _Seek_: Set video progress in seconds for all devices, or select the clip index to be displayed.
* _Fetch readyState_: Print the state of the server into the green log box.
* _Test Seek Latency_: Test for internal latency when seeking a time.

The log box below will log any activites like play/pause events. <br/> <br/>
If you're using video Fullscreen, make sure not to touch the screen as not to trigger video controls.
### Stopping the server
Stopping the server is as easy as just closing the PowerShell window running the log and closing the client and control tabs. <br/>
If you want to wipe all traces of the server, you can also delete the website data in your browser settings and delete the trusted certificate profile if neccessary.

And that's it. <br/> <br/>
PS: Technoblade never dies.
