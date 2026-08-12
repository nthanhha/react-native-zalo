package com.zalo

import com.facebook.react.bridge.ReactApplicationContext

class ZaloModule(reactContext: ReactApplicationContext) :
  NativeZaloSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeZaloSpec.NAME
  }
}
