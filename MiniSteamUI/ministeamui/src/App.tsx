import { useState } from "react";

function App() {
  const [showIframe, setShowIframe] = useState(false);

  return (
    <>
      {!showIframe && (
        <button onClick={() => setShowIframe(true)}>
          Open Fullscreen iframe
        </button>
      )}

      {showIframe && (
        <iframe
          src="https://happy-mud-060686d00.4.azurestaticapps.net/"
          title="Fullscreen iframe"
          style={{
            position: "fixed",
            inset: 0,            // top:0 right:0 bottom:0 left:0
            width: "100vw",
            height: "100vh",
            border: "none",
          }}
        />
      )}
    </>
  );
}

export default App;
