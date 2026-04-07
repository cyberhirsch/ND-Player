package com.ndplayer.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.view.KeyEvent

class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val keyCode = when (intent.action) {
            ACTION_PLAY_PAUSE -> KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            ACTION_PREV       -> KeyEvent.KEYCODE_MEDIA_PREVIOUS
            ACTION_NEXT       -> KeyEvent.KEYCODE_MEDIA_NEXT
            else -> return
        }
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
    }

    companion object {
        const val ACTION_PLAY_PAUSE = "com.ndplayer.app.PLAY_PAUSE"
        const val ACTION_PREV       = "com.ndplayer.app.PREV"
        const val ACTION_NEXT       = "com.ndplayer.app.NEXT"
    }
}
