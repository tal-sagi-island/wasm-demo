// 1. The State (Held only here, shared by all tabs)
const connections = []; 
let currentCount = 0;
let wasmInstance = null;

// 2. Define minimal WASM binary (Exported function "add": adds two params)
const wasmBytes = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // Magic + Version
  0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, // Type: (i32, i32) -> i32
  0x03, 0x02, 0x01, 0x00, // Function Section
  0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00, // Export "add"
  0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b // Body: get_local 0, get_local 1, i32.add
]);

// 3. Initialize WASM once
WebAssembly.instantiate(wasmBytes).then(({ instance }) => {
  wasmInstance = instance;
  console.log("WASM Loaded in SharedWorker");
});

self.onconnect = (e) => {
  const port = e.ports[0];
  connections.push(port);

  // Send the current count immediately to the new tab so it's in sync
  port.postMessage({ type: 'UPDATE', value: currentCount });

  port.onmessage = (event) => {
    if (event.data === "INCREMENT" && wasmInstance) {
      
      // --- THE SHARED LOGIC ---
      // We use WASM to calculate the new state
      const result = wasmInstance.exports.add(currentCount, 1);
      currentCount = result;

      // --- THE BROADCAST ---
      // Tell ALL connected tabs the new number
      connections.forEach(conn => {
        conn.postMessage({ type: 'UPDATE', value: currentCount });
      });
    }
  };

  port.start();
};