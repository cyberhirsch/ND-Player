package com.ndplayer.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews

class NDPlayerWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id, prefs)
        }
    }

    companion object {
        const val PREFS_NAME = "NDPlayerWidget"
        const val KEY_TITLE = "title"
        const val KEY_ARTIST = "artist"
        const val KEY_IS_PLAYING = "isPlaying"

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int, prefs: SharedPreferences) {
            val title = prefs.getString(KEY_TITLE, "ND Player") ?: "ND Player"
            val artist = prefs.getString(KEY_ARTIST, "Not playing") ?: "Not playing"
            val isPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)

            val views = RemoteViews(context.packageName, R.layout.nd_player_widget)
            views.setTextViewText(R.id.tv_title, title)
            views.setTextViewText(R.id.tv_artist, artist)
            views.setImageViewResource(
                R.id.btn_play_pause,
                if (isPlaying) R.drawable.ic_widget_pause else R.drawable.ic_widget_play
            )

            // Button intents → WidgetActionReceiver
            views.setOnClickPendingIntent(R.id.btn_play_pause, actionIntent(context, WidgetActionReceiver.ACTION_PLAY_PAUSE, 1))
            views.setOnClickPendingIntent(R.id.btn_prev, actionIntent(context, WidgetActionReceiver.ACTION_PREV, 2))
            views.setOnClickPendingIntent(R.id.btn_next, actionIntent(context, WidgetActionReceiver.ACTION_NEXT, 3))

            // Tap widget body → open app
            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            views.setOnClickPendingIntent(
                R.id.widget_root,
                PendingIntent.getActivity(context, 0, openIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            )

            appWidgetManager.updateAppWidget(widgetId, views)
        }

        private fun actionIntent(context: Context, action: String, requestCode: Int): PendingIntent {
            val intent = Intent(context, WidgetActionReceiver::class.java).apply { this.action = action }
            return PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
    }
}
