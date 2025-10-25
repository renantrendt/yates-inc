export default function ContactPage() {
  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Contact Us</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-800 leading-relaxed">
              You are able to contact us by either:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg text-gray-800 mt-4">
              <li>Being at our HQ at MMS</li>
              <li>OR by some way shape or form, getting our contact</li>
            </ul>
            <p className="text-lg text-gray-800 leading-relaxed mt-6">
              If you do, we&apos;ll have a pleasure on getting your money back or simply talking to ya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

