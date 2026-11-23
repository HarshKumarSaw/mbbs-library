package com.harshkumarsaw.mbbslibrary.widget;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class TimetableSyncWorker extends Worker {
    private static final String TAG = "TimetableSyncWorker";
    private static final String TIMETABLE_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/data/timetable_college.json";
    public static final String PREFS_NAME = "mbbs_widget_prefs";

    public static final String KEY_STATUS = "key_status";
    public static final String KEY_TITLE = "key_title";
    public static final String KEY_TIME = "key_time";
    public static final String KEY_FACULTY = "key_faculty";
    public static final String KEY_LAST_SYNC = "key_last_sync";

    public TimetableSyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(TIMETABLE_URL + "?t=" + System.currentTimeMillis());
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.connect();

            if (conn.getResponseCode() != 200) {
                Log.w(TAG, "Server returned response code " + conn.getResponseCode());
                return Result.retry();
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            JSONObject root = new JSONObject(sb.toString());
            JSONArray events = root.optJSONArray("events");
            if (events == null) {
                events = new JSONArray();
            }

            // Target timezone: Asia/Kolkata
            TimeZone istTz = TimeZone.getTimeZone("Asia/Kolkata");
            SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            dayFormat.setTimeZone(istTz);

            SimpleDateFormat timeParseFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
            timeParseFormat.setTimeZone(istTz);

            SimpleDateFormat displayTimeFormat = new SimpleDateFormat("h:mm a", Locale.US);
            displayTimeFormat.setTimeZone(istTz);

            Date now = new Date();
            String todayStr = dayFormat.format(now);

            JSONObject activeSession = null;
            JSONObject nextSession = null;
            Date nextSessionStart = null;

            for (int i = 0; i < events.length(); i++) {
                JSONObject ev = events.getJSONObject(i);
                String startStr = ev.optString("start");
                String endStr = ev.optString("end");

                if (!startStr.startsWith(todayStr)) {
                    continue;
                }

                Date startDate = timeParseFormat.parse(startStr);
                Date endDate = timeParseFormat.parse(endStr);

                if (startDate == null || endDate == null) {
                    continue;
                }

                // Check if currently happening
                if (!now.before(startDate) && now.before(endDate)) {
                    activeSession = ev;
                    break;
                }

                // Check if upcoming today
                if (startDate.after(now)) {
                    if (nextSessionStart == null || startDate.before(nextSessionStart)) {
                        nextSession = ev;
                        nextSessionStart = startDate;
                    }
                }
            }

            SharedPreferences prefs = getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            if (activeSession != null) {
                editor.putString(KEY_STATUS, "HAPPENING NOW");
                editor.putString(KEY_TITLE, activeSession.optString("title", "Active Lecture"));
                Date sDate = timeParseFormat.parse(activeSession.optString("start"));
                Date eDate = timeParseFormat.parse(activeSession.optString("end"));
                String timeRange = displayTimeFormat.format(sDate) + " - " + displayTimeFormat.format(eDate);
                editor.putString(KEY_TIME, timeRange);

                String faculty = activeSession.optString("faculty", "");
                String loc = activeSession.optString("location", "GMC Jagdalpur");
                editor.putString(KEY_FACULTY, faculty.isEmpty() ? loc : faculty);
            } else if (nextSession != null) {
                editor.putString(KEY_STATUS, "NEXT UP");
                editor.putString(KEY_TITLE, nextSession.optString("title", "Upcoming Lecture"));
                Date sDate = timeParseFormat.parse(nextSession.optString("start"));
                Date eDate = timeParseFormat.parse(nextSession.optString("end"));
                String timeRange = displayTimeFormat.format(sDate) + " - " + displayTimeFormat.format(eDate);
                editor.putString(KEY_TIME, timeRange);

                String faculty = nextSession.optString("faculty", "");
                String loc = nextSession.optString("location", "GMC Jagdalpur");
                editor.putString(KEY_FACULTY, faculty.isEmpty() ? loc : faculty);
            } else {
                editor.putString(KEY_STATUS, "NO MORE CLASSES TODAY");
                editor.putString(KEY_TITLE, "Classes Completed");
                editor.putString(KEY_TIME, "See you tomorrow!");
                editor.putString(KEY_FACULTY, "Late BRKM GMC Jagdalpur");
            }

            editor.putLong(KEY_LAST_SYNC, System.currentTimeMillis());
            editor.apply();

            // Refresh Widget UI
            TimetableWidgetProvider.updateAllWidgets(getApplicationContext());

            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error syncing timetable: " + e.getMessage(), e);
            return Result.retry();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
