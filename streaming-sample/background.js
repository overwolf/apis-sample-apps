// Basic settings
const streamSettings = {
  provider: overwolf.streaming.enums.StreamingProvider.VideoRecorder,
  settings: {
    video: {
      capture_desktop: {
        enable: true
      }
    }
  }
};

// This will store the stream id
let streamId = null;

// Starts the stream
function startRecording() {
  if ( streamId !== null ) {
    console.log('startRecording(): can\'t start recording because there a stream already recording');
    return;
  }

  overwolf.streaming.start(streamSettings, result => {
    if (!result.success) {
      console.log('overwolf.streaming.start(): error:', result.error, result);
      return;
    }

    console.log('overwolf.streaming.start(): success:', result);

    // Store this for stopping the stream and manipulating stream settings
    streamId = result.stream_id;
  });
}

// Stops the stream
function stopRecording() {
  if ( streamId === null ) {
    console.log('stopRecording(): can\'t stop recording because there is no stream recording');
    return;
  }

  overwolf.streaming.stop(streamId, result => {
    if (result.success) {
      console.log('overwolf.streaming.stop(): success:', result);
      streamId = null;
    } else {
      console.log('overwolf.streaming.stop(): error:', result.error, result);
    }
  });
}

// Open the media folder in Explorer
function openFolder() {
  overwolf.utils.openWindowsExplorer(
    'overwolf://media/recordings/Streaming+Sample+App',
    e => console.log('overwolf.utils.openWindowsExplorer():', e)
  );
}

// Opens the developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'background');
}

// Opens the UI window
function openMainWindow() {
  overwolf.windows.obtainDeclaredWindow('main', result => {
    if ( result.success && result.window && result.window.id ) {
      overwolf.windows.restore(result.window.id, null);
    }
  });
}

window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.openFolder = openFolder;
window.openConsole = openConsole;

// Log relevant streaming events

overwolf.streaming.onStreamingError
  .addListener(e => console.log('overwolf.streaming.onStreamingError:', e));

overwolf.streaming.onStreamingWarning
  .addListener(e => console.log('overwolf.streaming.onStreamingWarning:', e));

// overwolf.streaming.onStartStreaming
//   .addListener(e => console.log('overwolf.streaming.onStartStreaming:', e));

// overwolf.streaming.onStopStreaming
//   .addListener(e => console.log('overwolf.streaming.onStopStreaming:', e));

// overwolf.streaming.onStreamingSourceImageChanged
//   .addListener(e => console.log('overwolf.streaming.onStreamingSourceImageChanged:', e));

overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
openMainWindow();
