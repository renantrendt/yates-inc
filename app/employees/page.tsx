import { employees } from '@/utils/products';
import Image from 'next/image';

export default function EmployeesPage() {
  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Our Team</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {employees.map((employee) => (
            <div
              key={employee.id}
              id={employee.anchor || undefined}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20 hover:shadow-lg transition-shadow"
            >
              {/* Scrollable image gallery for employees with images */}
              {employee.images && employee.images.length > 0 && (
                <div className="mb-4 overflow-x-auto employee-gallery">
                  <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
                    {employee.images.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 relative w-48 h-48 rounded-lg overflow-hidden shadow-md">
                        <Image
                          src={img}
                          alt={`${employee.name} - photo ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {employee.name}
                </h2>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">{employee.role}</p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{employee.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

