import { useState } from "react";
import { FiLink } from "react-icons/fi";

function BondSection({ tenantId }) {
  const [bonds, setBonds] = useState([]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bond Management
        </h2>
        <p className="text-gray-600">
          Manage connections and relationships between agents and external
          services.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="mb-6">
          <FiLink className="text-6xl mb-4 mx-auto text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Bond Section
          </h3>
          <p className="text-gray-600 mb-6">
            This section will contain bond management features including:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Create and manage connections
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Configure integration settings
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Monitor bond status
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Relationship mapping
            </li>
          </ul>

          <div className="flex gap-4 justify-center mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Create New Bond
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 transition-colors">
              View Bond Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BondSection;
