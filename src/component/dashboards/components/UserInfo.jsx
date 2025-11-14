import React, { useEffect, useMemo, useState } from "react";
import { FaAddressBook, FaSyncAlt, FaUsers } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const LIMIT_OPTIONS = [10, 20, 50];

const getAdminToken = () =>
  localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
};

const tabButtonClass = (isActive) =>
  `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-red-600 text-white shadow-sm"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;

const UserInfo = () => {
  const [activeSection, setActiveSection] = useState("app-users");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      400
    );
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const isAppUsers = activeSection === "app-users";

  useEffect(() => {
    let isCancelled = false;
    const endpoint = isAppUsers ? "users" : "contacts";

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getAdminToken();
        const params = new URLSearchParams({
          limit: String(limit),
          page: String(page),
        });
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }
        const response = await fetch(
          `${API_BASE_URL}/user-info/${endpoint}?${params.toString()}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to fetch data");
        }

        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.message || "Failed to fetch data");
        }

        const records = Array.isArray(payload.data) ? payload.data : [];
        if (!isCancelled) {
          if (isAppUsers) {
            setUsers(records);
          } else {
            setContacts(records);
          }
          setPagination(
            payload.pagination || {
              total: records.length,
              pages: 1,
              page: 1,
              limit,
            }
          );
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [isAppUsers, limit, page, debouncedSearch, refreshSignal]);

  useEffect(() => {
    setPage(1);
  }, [activeSection, limit, debouncedSearch]);

  const currentData = isAppUsers ? users : contacts;

  const columns = useMemo(() => {
    if (isAppUsers) {
      return [
        { key: "name", label: "Name", render: (row) => row.name || "—" },
        { key: "email", label: "Email", render: (row) => row.email || "—" },
        {
          key: "mobileNumber",
          label: "Phone",
          render: (row) => row.mobileNumber || "—",
        },
        {
          key: "clientId",
          label: "Client ID",
          render: (row) => row.clientId || "—",
        },
        {
          key: "isRegistered",
          label: "Registered",
          render: (row) => (row.isRegistered ? "Yes" : "No"),
        },
        {
          key: "lastActive",
          label: "Last Active",
          render: (row) => formatDateTime(row.lastActive),
        },
      ];
    }
    return [
      { key: "name", label: "Name", render: (row) => row.name || "—" },
      { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
      { key: "email", label: "Email", render: (row) => row.email || "—" },
      {
        key: "clientId",
        label: "Client ID",
        render: (row) => row.clientId || "—",
      },
      {
        key: "countyCode",
        label: "Country Code",
        render: (row) => row.countyCode || "—",
      },
      {
        key: "createdAt",
        label: "Created",
        render: (row) => formatDateTime(row.createdAt),
      },
    ];
  }, [isAppUsers]);

  const handleSectionChange = (section) => {
    if (section === activeSection) return;
    setActiveSection(section);
    setError("");
  };

  const handleLimitChange = (event) => {
    const value = Number(event.target.value);
    setLimit(value);
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshSignal((prev) => prev + 1);
  };

  const currentPage = pagination.page || page;
  const maxPages =
    pagination.pages || Math.max(1, Math.ceil((pagination.total || 0) / limit));
  const hasPrev = currentPage > 1 && !loading;
  const hasNext = currentPage < maxPages && !loading;
  const startRecord = currentData.length ? (currentPage - 1) * limit + 1 : 0;
  const endRecord = currentData.length
    ? (currentPage - 1) * limit + currentData.length
    : 0;

  let tableContent;
  if (error) {
    tableContent = (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    );
  } else if (loading) {
    tableContent = (
      <div className="py-12 flex flex-col items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500 border-opacity-75 mb-3"></div>
        <p className="text-sm">Fetching {activeSection.replace("-", " ")}…</p>
      </div>
    );
  } else if (!currentData.length) {
    tableContent = (
      <div className="py-12 text-center text-gray-500">
        No records found for the selected filters.
      </div>
    );
  } else {
    tableContent = (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentData.map((row, index) => {
              const rowKey =
                row._id ||
                row.sessionId ||
                row.phone ||
                `${row.clientId || "row"}-${index}`;
              return (
                <tr key={rowKey}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-gray-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            User Information
          </h3>
          <p className="text-sm text-gray-500">
            Review app users and contacts with quick filters and limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full sm:w-64 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 transition-colors"
            title="Refresh"
          >
            <FaSyncAlt size={16} />
          </button>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSectionChange("app-users")}
            className={tabButtonClass(isAppUsers)}
          >
            <FaUsers size={16} />
            App Users
          </button>
          <button
            onClick={() => handleSectionChange("contacts")}
            className={tabButtonClass(!isAppUsers)}
          >
            <FaAddressBook size={16} />
            Contacts
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <label htmlFor="user-info-limit" className="text-gray-600">
              Rows per page
            </label>
            <select
              id="user-info-limit"
              value={limit}
              onChange={handleLimitChange}
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">{tableContent}</div>

      <div className="border-t border-gray-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
        <div>
          Showing <span className="font-medium">{startRecord}</span> to{" "}
          <span className="font-medium">{endRecord}</span> of{" "}
          <span className="font-medium">{pagination.total || 0}</span> entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => hasPrev && setPage((prev) => Math.max(prev - 1, 1))}
            disabled={!hasPrev}
            className={`px-4 py-2 rounded-md border ${
              hasPrev
                ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
          >
            Previous
          </button>
          <span>
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{maxPages}</span>
          </span>
          <button
            onClick={() => hasNext && setPage((prev) => prev + 1)}
            disabled={!hasNext}
            className={`px-4 py-2 rounded-md border ${
              hasNext
                ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
