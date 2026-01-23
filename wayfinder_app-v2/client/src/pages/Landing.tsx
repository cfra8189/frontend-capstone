export default function Landing() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-xl">
              W
            </div>
            <span className="text-xl font-bold">WayfinderOS</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Your Creative Work,{" "}
            <span className="text-accent">Protected.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Track projects from concept to publication. Manage metadata, generate agreements, and protect your intellectual property.
          </p>
        </div>
        <div className="text-gray-600 text-sm">
          <p>&copy; 2026 WayfinderOS. REVERIE | RVR Creative Development</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-xl">
              W
            </div>
            <span className="text-xl font-bold">WayfinderOS</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome</h2>
          <p className="text-gray-400 mb-8">
            Sign in to manage your creative assets
          </p>

          <a
            href="/api/login"
            className="inline-block w-full bg-accent text-black font-bold py-4 px-8 rounded-lg hover:bg-green-400 transition-colors"
          >
            Sign In with OAuth
          </a>

          <p className="mt-6 text-gray-500 text-sm">
            Sign in with Google, GitHub, Apple, or email
          </p>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <h3 className="text-sm font-bold text-gray-400 mb-4">Features</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Project Tracking</p>
                <p className="text-xs text-gray-500">Concept to publication</p>
              </div>
              <div className="p-4 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">IP Protection</p>
                <p className="text-xs text-gray-500">Step-by-step guidance</p>
              </div>
              <div className="p-4 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Agreements</p>
                <p className="text-xs text-gray-500">Generate legal docs</p>
              </div>
              <div className="p-4 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Creative Space</p>
                <p className="text-xs text-gray-500">Private inspiration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
