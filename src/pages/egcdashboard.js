import React from 'react';

const EGCDashboard = () => {
  React.useEffect(() => {
    document.body.className = '';
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';
    return () => {
      document.body.style.cssText = '';
    };
  }, []);

  return (
    <iframe
      src="/egcdashboard.html"
      style={{ display: 'block', width: '100vw', height: '100vh', border: 'none' }}
      title="EGC Database"
    />
  );
};

export default EGCDashboard;

export const Head = () => (
  <>
    <title>EGC Database</title>
    <meta name="robots" content="noindex" />
    <style>{`* { margin: 0; padding: 0; } html, body { height: 100%; overflow: hidden; }`}</style>
  </>
);