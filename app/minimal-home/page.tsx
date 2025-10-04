export default function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <h1 className="text-4xl font-bold text-gray-900 text-center">
            Minimal Home Page
          </h1>
          <p className="text-xl text-gray-600 text-center mt-4">
            This is a simplified version without complex components.
          </p>
          <div className="text-center mt-8">
            <a
              href="/basic"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mr-4"
            >
              Basic Page
            </a>
            <a
              href="/debug"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Debug Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
