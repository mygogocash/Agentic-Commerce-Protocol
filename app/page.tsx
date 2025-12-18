
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">GoGoCash Agent API</h1>
      <p className="text-lg text-gray-300 mb-8">Agentic Commerce Protocol Integrations Running</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Link Wallet</h2>
          <code className="text-sm bg-gray-950 p-1 rounded font-mono text-green-400">POST /api/linkWallet</code>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Search Products</h2>
          <code className="text-sm bg-gray-950 p-1 rounded font-mono text-green-400">GET /api/searchProducts</code>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Get Cashback</h2>
          <code className="text-sm bg-gray-950 p-1 rounded font-mono text-green-400">GET /api/getCashback</code>
        </div>
      </div>
    </div>
  );
}
