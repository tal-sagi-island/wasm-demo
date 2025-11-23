self.onconnect = (e) => {
  const port = e.ports[0];

  port.onmessage = async (event) => {
    if (event.data === "START_WASM") {
      // This runs INVISIBLE to the extension
      // Minimal WASM binary (Magic header + version)
      const wasmBytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
      
      const { instance } = await WebAssembly.instantiate(wasmBytes);
      port.postMessage("WASM runs inside SharedWorker! (ID: " + Math.random().toString().slice(2,5) + ")");
    }
  };
};