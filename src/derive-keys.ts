import * as moneroTs from "monero-ts";

// 1. Working Daemon Connection (from your original)
async function connectToMoneroDaemon(host: string = 'stagenet.xmr-tw.org', port: number = 38081): Promise<boolean> {
  try {
    console.log(`Attempting to connect to Monero daemon at ${host}:${port}...`);
    
    const rpcUrl = `http://${host}:${port}/json_rpc`;
    const request = {
      jsonrpc: '2.0',
      id: '0',
      method: 'get_info'
    };
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.result) {
      console.log('Successfully connected to Monero daemon!');
      console.log('\nDaemon information:');
      console.log(`- Height: ${data.result.height}`);
      console.log(`- Network: ${data.result.nettype}`);
      console.log(`- Version: ${data.result.version}`);
      console.log(`- Synchronized: ${data.result.synchronized}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Daemon connection failed:', error);
    return false;
  }
}

// 2. Working Keys-Only Wallet (from your working version)
async function createKeysOnlyWallet() {
  try {
    const mnemonic = "invoke diet urgent pride cucumber gemstone dude ruined rover nodes nibs losing podcast lynx sidekick byline idols yoga lion opened visited ethics unhappy unwind cucumber";
    
    const wallet = await moneroTs.createWalletKeys({
      networkType: moneroTs.MoneroNetworkType.STAGENET,
      seed: mnemonic,
      restoreHeight: 1542000,
      proxyToWorker: false
    });
    
    console.log("\nKeys-Only Wallet Details:");
    console.log("Primary Address:", await wallet.getPrimaryAddress());
    console.log("Private View Key:", await wallet.getPrivateViewKey());
    console.log("Private Spend Key:", await wallet.getPrivateSpendKey());
    
    await wallet.close();
  } catch (error) {
    console.error("\nKeys-Only Wallet Error:", error);
  }
}

// 3. Wallet Creation with Sync (the problematic one - now fixed)
async function createFullWallet() {
  try {
    const mnemonic = "invoke diet urgent pride cucumber gemstone dude ruined rover nodes nibs losing podcast lynx sidekick byline idols yoga lion opened visited ethics unhappy unwind cucumber";
    
    // Create wallet with main thread execution
    const wallet = await moneroTs.createWalletFull({
      networkType: moneroTs.MoneroNetworkType.STAGENET,
      seed: mnemonic,
      restoreHeight: 1542000,
      server: {
        uri: "http://stagenet.xmr-tw.org:38081",
        rejectUnauthorized: false
      },
      proxyToWorker: false,
      fs: (moneroTs as any).MoneroFs?.nodeFs() // Optional filesystem binding
    });

    console.log("\nFull Wallet Created!");
    console.log("Primary Address:", await wallet.getPrimaryAddress());
    
    // Simplified sync with progress
    console.log("Syncing blockchain...");
    await wallet.sync({
      onSyncProgress: (height: number) => {
        console.log(`Synced to block ${height}`);
        return Promise.resolve();
      },
      onNewBlock: () => Promise.resolve(),
      onBalancesChanged: () => Promise.resolve(),
      onOutputReceived: () => Promise.resolve(),
      onOutputSpent: () => Promise.resolve()
    });

    const balance = await wallet.getBalance();
    console.log(`Balance: ${Number(balance) / 1e12} XMR`);
    
    await wallet.close();
  } catch (error) {
    console.error("\nFull Wallet Error:", error);
  }
}

// Main function
async function main() {
  try {
    // 1. Check daemon connection
    await connectToMoneroDaemon();
    
    // 2. Create keys-only wallet 
    await createKeysOnlyWallet();
    
    // 3. Create full wallet 
    await createFullWallet();
    
  } catch (error) {
    console.error('Main execution error:', error);
  }
}

main().catch(console.error);