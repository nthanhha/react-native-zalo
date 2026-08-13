import Foundation
import React
import UIKit
import ZaloSDK

@objc public class ZaloBridge: NSObject {

  /// Zalo SDK error code for user cancellation.
  private static let errorCodeUserCancel = ZaloSDKErrorCode.sdkErrorCodeUserCancel.rawValue

  // MARK: - Login

  @objc public func login(
    codeChallenge: String,
    loginType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let authenType: ZAZaloSDKAuthenType
    switch loginType {
    case "app":
      authenType = ZAZaloSDKAuthenTypeViaZaloAppOnly
    case "web":
      authenType = ZAZaloSDKAuthenTypeViaWebViewOnly
    default:
      authenType = ZAZAloSDKAuthenTypeViaZaloAppAndWebView
    }

    DispatchQueue.main.async {
      guard let rootVC = UIApplication.shared.delegate?.window??.rootViewController else {
        reject("NO_VIEW_CONTROLLER", "Cannot find root view controller", nil)
        return
      }

      ZaloSDK.sharedInstance().authenticateZalo(
        with: authenType,
        parentController: rootVC,
        codeChallenge: codeChallenge,
        extInfo: nil
      ) { response in
        guard let response = response else {
          reject("LOGIN_ERROR", "Login failed: no response from Zalo SDK", nil)
          return
        }

        if response.isSucess {
          let result: [String: Any] = [
            "oauthCode": response.oauthCode ?? "",
            "errorCode": -1,
            "errorMessage": "",
          ]
          resolve(result)
        } else if response.errorCode != ZaloBridge.errorCodeUserCancel {
          let result: [String: Any] = [
            "oauthCode": "",
            "errorCode": response.errorCode,
            "errorMessage": response.errorMessage ?? "Login failed",
          ]
          resolve(result)
        } else {
          let result: [String: Any] = [
            "oauthCode": "",
            "errorCode": ZaloBridge.errorCodeUserCancel,
            "errorMessage": "User cancelled",
          ]
          resolve(result)
        }
      }
    }
  }

  // MARK: - Get Access Token by OAuth Code

  @objc public func getAccessTokenByOAuthCode(
    oauthCode: String,
    codeVerifier: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    ZaloSDK.sharedInstance().getAccessToken(
      withOAuthCode: oauthCode,
      codeVerifier: codeVerifier
    ) { tokenResponse in
      if let tokenResponse = tokenResponse,
        tokenResponse.isSucess
      {
        let result: [String: Any] = [
          "accessToken": tokenResponse.accessToken ?? "",
          "refreshToken": tokenResponse.refreshToken ?? "",
          "expiresIn": tokenResponse.expriedTime,
          "errorCode": tokenResponse.errorCode,
          "errorMessage": "",
        ]
        resolve(result)
      } else {
        let result: [String: Any] = [
          "accessToken": "",
          "refreshToken": "",
          "expiresIn": 0,
          "errorCode": tokenResponse?.errorCode ?? -1,
          "errorMessage": tokenResponse?.errorMessage ?? "Get access token failed",
        ]
        resolve(result)
      }
    }
  }

  // MARK: - Get Access Token by Refresh Token

  @objc public func getAccessTokenByRefreshToken(
    refreshToken: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    ZaloSDK.sharedInstance().getAccessToken(
      withRefreshToken: refreshToken
    ) { tokenResponse in
      if let tokenResponse = tokenResponse,
        tokenResponse.isSucess
      {
        let result: [String: Any] = [
          "accessToken": tokenResponse.accessToken ?? "",
          "refreshToken": tokenResponse.refreshToken ?? "",
          "expiresIn": tokenResponse.expriedTime,
          "errorCode": tokenResponse.errorCode,
          "errorMessage": "",
        ]
        resolve(result)
      } else {
        let result: [String: Any] = [
          "accessToken": "",
          "refreshToken": "",
          "expiresIn": 0,
          "errorCode": tokenResponse?.errorCode ?? -1,
          "errorMessage": tokenResponse?.errorMessage ?? "Get access token failed",
        ]
        resolve(result)
      }
    }
  }

  // MARK: - Validate Refresh Token

  @objc public func validateRefreshToken(
    refreshToken: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    ZaloSDK.sharedInstance().validateRefreshToken(
      refreshToken,
      extInfo: nil
    ) { response in
      if response?.isSucess == true {
        let result: [String: Any] = [
          "isValid": true,
          "errorCode": response?.errorCode ?? 0,
          "errorMessage": "",
        ]
        resolve(result)
      } else {
        let result: [String: Any] = [
          "isValid": false,
          "errorCode": response?.errorCode ?? -1,
          "errorMessage": response?.errorMessage ?? "Refresh token is invalid",
        ]
        resolve(result)
      }
    }
  }

  // MARK: - Logout

  @objc public func logout() {
    ZaloSDK.sharedInstance().unauthenticate()
  }

  // MARK: - Get Profile

  @objc public func getProfile(
    accessToken: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    ZaloSDK.sharedInstance().getZaloUserProfile(
      withAccessToken: accessToken
    ) { response in
      var result: [String: Any] = [
        "errorCode": response?.errorCode ?? -1,
        "errorMessage": response?.errorMessage ?? "",
        "id": "",
        "name": "",
      ]

      if let data = response?.data as? [String: Any] {
        result["id"] = data["id"] ?? ""
        result["name"] = data["name"] ?? ""

        if let picture = data["picture"] as? [String: Any] {
          result["picture"] = picture
        }
      }

      resolve(result)
    }
  }
}
