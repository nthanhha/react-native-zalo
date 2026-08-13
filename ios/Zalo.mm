#import "Zalo.h"
#import "Zalo-Swift.h"

@implementation Zalo {
  ZaloBridge *_bridge;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _bridge = [[ZaloBridge alloc] init];
  }
  return self;
}

- (void)login:(NSString *)codeChallenge
    loginType:(NSString *)loginType
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
  [_bridge loginWithCodeChallenge:codeChallenge loginType:loginType resolve:resolve reject:reject];
}

- (void)getAccessTokenByOAuthCode:(NSString *)oauthCode
                     codeVerifier:(NSString *)codeVerifier
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject {
  [_bridge getAccessTokenByOAuthCodeWithOauthCode:oauthCode
                                     codeVerifier:codeVerifier
                                          resolve:resolve
                                           reject:reject];
}

- (void)getAccessTokenByRefreshToken:(NSString *)refreshToken
                             resolve:(RCTPromiseResolveBlock)resolve
                              reject:(RCTPromiseRejectBlock)reject {
  [_bridge getAccessTokenByRefreshTokenWithRefreshToken:refreshToken resolve:resolve reject:reject];
}

- (void)validateRefreshToken:(NSString *)refreshToken
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
  [_bridge validateRefreshTokenWithRefreshToken:refreshToken resolve:resolve reject:reject];
}

- (void)logout {
  [_bridge logout];
}

- (void)getProfile:(NSString *)accessToken
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  [_bridge getProfileWithAccessToken:accessToken resolve:resolve reject:reject];
}

- (void)initialize {
}

- (void)invalidate {
  // clean up
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeZaloSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"Zalo";
}

@end
