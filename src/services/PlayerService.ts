import TrackPlayer, { Event, State } from 'react-native-track-player';
import { NativeModules } from 'react-native';

const { NDPlayerWidget } = NativeModules;

async function pushWidgetUpdate() {
    try {
        const track = await TrackPlayer.getActiveTrack();
        const playbackState = await TrackPlayer.getPlaybackState();
        const isPlaying = playbackState.state === State.Playing;
        if (NDPlayerWidget) {
            NDPlayerWidget.updateWidget(
                track?.title ?? 'ND Player',
                track?.artist ?? 'Not playing',
                isPlaying
            );
        }
    } catch (_) {
        // widget update is non-critical
    }
}

export async function PlaybackService() {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, pushWidgetUpdate);
    TrackPlayer.addEventListener(Event.PlaybackState, pushWidgetUpdate);
}
