package com.ndplayer.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NDPlayerWidget"

    @ReactMethod
    fun updateWidget(title: String, artist: String, isPlaying: Boolean) {
        val prefs = reactContext.getSharedPreferences(NDPlayerWidget.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(NDPlayerWidget.KEY_TITLE, title)
            .putString(NDPlayerWidget.KEY_ARTIST, artist)
            .putBoolean(NDPlayerWidget.KEY_IS_PLAYING, isPlaying)
            .apply()

        val manager = AppWidgetManager.getInstance(reactContext)
        val ids = manager.getAppWidgetIds(ComponentName(reactContext, NDPlayerWidget::class.java))
        for (id in ids) {
            NDPlayerWidget.updateWidget(reactContext, manager, id, prefs)
        }
    }
}
