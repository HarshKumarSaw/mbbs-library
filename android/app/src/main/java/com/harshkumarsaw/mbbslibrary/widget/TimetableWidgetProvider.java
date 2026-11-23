package com.harshkumarsaw.mbbslibrary.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import androidx.core.content.ContextCompat;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.harshkumarsaw.mbbslibrary.R;

import java.util.concurrent.TimeUnit;

public class TimetableWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH_WIDGET = "com.harshkumarsaw.mbbslibrary.ACTION_REFRESH_WIDGET";
    private static final String BASE_URL = "https://harshkumarsaw.github.io/mbbs-library/";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId);
        }
        // Enqueue background sync
        enqueueImmediateSync(context);
        schedulePeriodicSync(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        enqueueImmediateSync(context);
        schedulePeriodicSync(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH_WIDGET.equals(intent.getAction())) {
            enqueueImmediateSync(context);
        }
    }

    private static void schedulePeriodicSync(Context context) {
        PeriodicWorkRequest periodicWork = new PeriodicWorkRequest.Builder(
                TimetableSyncWorker.class, 30, TimeUnit.MINUTES)
                .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "mbbs_timetable_periodic_sync",
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWork);
    }

    private static void enqueueImmediateSync(Context context) {
        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(TimetableSyncWorker.class).build();
        WorkManager.getInstance(context).enqueue(workRequest);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, TimetableWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
        for (int widgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId);
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_timetable);
        SharedPreferences prefs = context.getSharedPreferences(TimetableSyncWorker.PREFS_NAME, Context.MODE_PRIVATE);

        String status = prefs.getString(TimetableSyncWorker.KEY_STATUS, "TAP TO SYNC");
        String title = prefs.getString(TimetableSyncWorker.KEY_TITLE, "Harsh's Library Schedule");
        String time = prefs.getString(TimetableSyncWorker.KEY_TIME, "Tap to load timetable");
        String faculty = prefs.getString(TimetableSyncWorker.KEY_FACULTY, "GMC Jagdalpur");

        views.setTextViewText(R.id.tv_status_badge, status);
        views.setTextViewText(R.id.tv_class_title, title);
        views.setTextViewText(R.id.tv_class_time, time);
        views.setTextViewText(R.id.tv_class_faculty, faculty);

        if ("HAPPENING NOW".equals(status)) {
            views.setInt(R.id.tv_status_badge, "setBackgroundResource", R.drawable.badge_active);
            views.setTextColor(R.id.tv_status_badge, ContextCompat.getColor(context, R.color.badge_active_text));
        } else if ("NEXT UP".equals(status)) {
            views.setInt(R.id.tv_status_badge, "setBackgroundResource", R.drawable.badge_upcoming);
            views.setTextColor(R.id.tv_status_badge, ContextCompat.getColor(context, R.color.badge_upcoming_text));
        } else {
            views.setInt(R.id.tv_status_badge, "setBackgroundResource", R.drawable.badge_idle);
            views.setTextColor(R.id.tv_status_badge, ContextCompat.getColor(context, R.color.badge_idle_text));
        }

        // Refresh action
        Intent refreshIntent = new Intent(context, TimetableWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH_WIDGET);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(
                context, 0, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_widget_refresh, refreshPendingIntent);

        // Click on class card -> Opens Timetable
        views.setOnClickPendingIntent(R.id.card_class_info, getWebLaunchPendingIntent(context, BASE_URL + "timetable.html", 100));

        // Quick action buttons
        views.setOnClickPendingIntent(R.id.btn_nav_timetable, getWebLaunchPendingIntent(context, BASE_URL + "timetable.html", 101));
        views.setOnClickPendingIntent(R.id.btn_nav_anatomy, getWebLaunchPendingIntent(context, BASE_URL + "anatomy.html", 102));
        views.setOnClickPendingIntent(R.id.btn_nav_physio, getWebLaunchPendingIntent(context, BASE_URL + "physiology.html", 103));
        views.setOnClickPendingIntent(R.id.btn_nav_biochem, getWebLaunchPendingIntent(context, BASE_URL + "biochemistry.html", 104));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent getWebLaunchPendingIntent(Context context, String url, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
