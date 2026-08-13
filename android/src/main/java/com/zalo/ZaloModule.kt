package com.zalo

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.zing.zalo.zalosdk.oauth.LoginVia
import com.zing.zalo.zalosdk.oauth.OAuthCompleteListener
import com.zing.zalo.zalosdk.oauth.OauthResponse
import com.zing.zalo.zalosdk.oauth.ZaloSDK
import com.zing.zalo.zalosdk.oauth.model.ErrorResponse
import org.json.JSONArray
import org.json.JSONObject

class ZaloModule(reactContext: ReactApplicationContext) :
  NativeZaloSpec(reactContext), ActivityEventListener {

  override fun initialize() {
    super.initialize()
    reactApplicationContext.addActivityEventListener(this)
  }

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(this)
    super.invalidate()
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    ZaloSDK.Instance.onActivityResult(activity, requestCode, resultCode, data)
  }

  override fun onNewIntent(intent: Intent) {
    // no-op
  }

  companion object {
    const val NAME = NativeZaloSpec.NAME
  }

  override fun login(codeChallenge: String, loginType: String, promise: Promise) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      promise.reject("ERR_NO_ACTIVITY", "Current activity is null")
      return
    }

    val loginVia = when (loginType) {
      "app" -> LoginVia.APP
      "web" -> LoginVia.WEB
      "app_or_web" -> LoginVia.APP_OR_WEB
      else -> LoginVia.APP_OR_WEB
    }

    ZaloSDK.Instance.authenticateZaloWithAuthenType(
      activity,
      loginVia,
      codeChallenge,
      object : OAuthCompleteListener() {
        override fun onAuthenError(errorResponse: ErrorResponse) {
          val result = Arguments.createMap()
          result.putString("oauthCode", "")
          result.putInt("errorCode", errorResponse.errorCode)
          result.putString("errorMessage", errorResponse.errorMsg)
          promise.resolve(result)
        }

        override fun onGetOAuthComplete(response: OauthResponse) {
          val result = Arguments.createMap()
          result.putString("oauthCode", response.oauthCode)
          result.putInt("errorCode", -1)
          result.putString("errorMessage", "")
          promise.resolve(result)
        }
      }
    )
  }

  override fun getAccessTokenByOAuthCode(
    oauthCode: String,
    codeVerifier: String,
    promise: Promise,
  ) {
    val context = reactApplicationContext

    ZaloSDK.Instance.getAccessTokenByOAuthCode(
      context,
      oauthCode,
      codeVerifier
    ) { data ->
      val result = Arguments.createMap()
      val errorCode = data.optInt("error", 0)
      result.putString("accessToken", data.optString("access_token", ""))
      result.putString("refreshToken", data.optString("refresh_token", ""))
      result.putDouble("expiresIn", data.optString("expires_in", "0").toDouble())
      result.putInt("errorCode", errorCode)
      result.putString("errorMessage", data.optString("error_message", ""))
      promise.resolve(result)
    }
  }

  override fun getAccessTokenByRefreshToken(refreshToken: String, promise: Promise) {
    val context = reactApplicationContext

    ZaloSDK.Instance.getAccessTokenByRefreshToken(
      context,
      refreshToken
    ) { data ->
      val result = Arguments.createMap()
      val errorCode = data.optInt("error", 0)
      result.putString("accessToken", data.optString("access_token", ""))
      result.putString("refreshToken", data.optString("refresh_token", ""))
      result.putDouble("expiresIn", data.optString("expires_in", "0").toDouble())
      result.putInt("errorCode", errorCode)
      result.putString("errorMessage", data.optString("error_message", ""))
      promise.resolve(result)
    }
  }

  override fun validateRefreshToken(refreshToken: String, promise: Promise) {
    ZaloSDK.Instance.isAuthenticate(
      refreshToken
    ) { validated, errorCode, _ ->
      val result = Arguments.createMap()
      result.putBoolean("isValid", validated)
      result.putInt("errorCode", errorCode)
      result.putString("errorMessage", "")
      promise.resolve(result)
    }
  }

  override fun logout() {
    ZaloSDK.Instance.unauthenticate()
  }

  override fun getProfile(accessToken: String, promise: Promise) {
    val context = reactApplicationContext

    ZaloSDK.Instance.getProfile(
      context,
      accessToken,
      { data ->
        val result = Arguments.createMap()
        result.putString("id", data.optString("id", ""))
        result.putString("name", data.optString("name", ""))
        result.putInt("errorCode", data.optInt("error", 0))
        result.putString("errorMessage", data.optString("message", ""))

        val picture = data.optJSONObject("picture")
        if (picture != null) {
          result.putMap("picture", jsonObjectToWritableMap(picture))
        }

        promise.resolve(result)
      },
      arrayOf("id", "name", "picture")
    )
  }

  private fun jsonObjectToWritableMap(jsonObject: JSONObject): WritableMap {
    val map = Arguments.createMap()
    val keys = jsonObject.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      when (val value = jsonObject.opt(key)) {
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        is Long -> map.putDouble(key, value.toDouble())
        is Double -> map.putDouble(key, value)
        is String -> map.putString(key, value)
        is JSONObject -> map.putMap(key, jsonObjectToWritableMap(value))
        is JSONArray -> map.putArray(key, jsonArrayToWritableArray(value))
        null -> map.putNull(key)
        else -> map.putString(key, value.toString())
      }
    }
    return map
  }

  private fun jsonArrayToWritableArray(jsonArray: JSONArray): com.facebook.react.bridge.WritableArray {
    val array = Arguments.createArray()
    for (i in 0 until jsonArray.length()) {
      when (val value = jsonArray.opt(i)) {
        is Boolean -> array.pushBoolean(value)
        is Int -> array.pushInt(value)
        is Long -> array.pushDouble(value.toDouble())
        is Double -> array.pushDouble(value)
        is String -> array.pushString(value)
        is JSONObject -> array.pushMap(jsonObjectToWritableMap(value))
        is JSONArray -> array.pushArray(jsonArrayToWritableArray(value))
        null -> array.pushNull()
        else -> array.pushString(value.toString())
      }
    }
    return array
  }
}
