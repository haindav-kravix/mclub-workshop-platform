import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = 'signin_with',
}) => {
  const containerRef = React.useRef(null);
  const [buttonWidth, setButtonWidth] = React.useState(320);

  React.useLayoutEffect(() => {
    const updateWidth = () => {
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth - 48;
      setButtonWidth(Math.max(220, Math.min(360, Math.floor(containerWidth))));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  return (
    <div ref={containerRef} className="google-auth-button-wrap">
      <GoogleLogin
        key={buttonWidth}
        onSuccess={onSuccess}
        onError={onError}
        text={text}
        size="large"
        shape="rectangular"
        width={`${buttonWidth}`}
      />
    </div>
  );
};
