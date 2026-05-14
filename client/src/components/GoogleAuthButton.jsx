import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = 'signin_with',
}) => (
  <div className="google-auth-button-wrap">
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      text={text}
      size="large"
      shape="rectangular"
      type="standard"
      theme="outline"
      width="420"
      useOneTap={false}
    />
  </div>
);
