export default function BasicPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Basic Test Page
        </h1>
        <p className="text-gray-600 text-center mb-6">
          This is a simple test page without any complex components or hooks.
        </p>
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
