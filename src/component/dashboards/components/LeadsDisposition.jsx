import React, { useMemo, useState } from "react";

const LeadsDisposition = ({ dialsLeads, fetchLeadDetails }) => {
  const [level, setLevel] = useState(1); // 1: category, 2: subCategory group, 3: mini leads
  const [activeCategory, setActiveCategory] = useState("connected");
  const [activeGroup, setActiveGroup] = useState(""); // interested | notInterested | dnp | cnc | other

  const statusGroups = useMemo(
    () => ({
      connected: {
        interested: {
          hotLeads: ["payment_pending"],
          warmLeads: [
            "call_back_schedule",
            "information_shared",
            "follow_up_required",
          ],
          followUp: [
            "call_back_due",
            "whatsapp_sent",
            "interested_waiting_confimation",
            "interested_waiting_confirmation",
          ],
          converted: [
            "admission_confirmed",
            "payment_recieved",
            "payment_received",
            "course_started",
          ],
        },
        notInterested: {
          closedLost: [
            "not_interested",
            "joined_another_institute",
            "dropped_the_plan",
            "dnd",
            "unqualified_lead",
            "wrong_number",
            "invalid_number",
          ],
          futureProspect: ["postpone"],
        },
      },
      notConnected: {
        dnp: ["no_response", "call_busy", "call_bussy"],
        cnc: ["not_reachable", "switched_off", "out_of_coverage"],
        other: ["call_disconnected", "call_later"],
      },
    }),
    []
  );

  const getCount = (keys) => {
    let total = 0;
    for (const k of keys) total += dialsLeads?.[k]?.count || 0;
    return total;
  };

  // Aggregate totals per top-level category
  const allKeysForCategory = (categoryKey) => {
    if (categoryKey === "connected") {
      const { interested, notInterested } = statusGroups.connected;
      return [
        ...interested.hotLeads,
        ...interested.warmLeads,
        ...interested.followUp,
        ...interested.converted,
        ...notInterested.closedLost,
        ...notInterested.futureProspect,
      ];
    }
    const { dnp, cnc, other } = statusGroups.notConnected;
    return [...dnp, ...cnc, ...other];
  };

  const connectedTotal = useMemo(
    () => getCount(allKeysForCategory("connected")),
    [dialsLeads]
  );
  const notConnectedTotal = useMemo(
    () => getCount(allKeysForCategory("notConnected")),
    [dialsLeads]
  );

  const pill = (bg, text, hover) =>
    `rounded-xl p-4 text-left border shadow-sm transition-transform duration-150 ${bg} ${text} hover:${hover} hover:-translate-y-0.5 hover:shadow-md`;

  const groupCardClass = (key) => {
    switch (key) {
      case "hotLeads":
        return pill(
          "bg-gradient-to-br from-red-200 to-red-300 border-red-300",
          "text-red-900",
          "shadow-red-300"
        );
      case "warmLeads":
        return pill(
          "bg-gradient-to-br from-amber-200 to-yellow-300 border-amber-300",
          "text-yellow-900",
          "shadow-amber-300"
        );
      case "followUp":
        return pill(
          "bg-gradient-to-br from-indigo-200 to-indigo-300 border-indigo-300",
          "text-indigo-900",
          "shadow-indigo-300"
        );
      case "converted":
        return pill(
          "bg-gradient-to-br from-emerald-200 to-green-300 border-emerald-300",
          "text-green-900",
          "shadow-emerald-300"
        );
      case "closedLost":
        return pill(
          "bg-gradient-to-br from-rose-200 to-rose-300 border-rose-300",
          "text-rose-900",
          "shadow-rose-300"
        );
      case "futureProspect":
        return pill(
          "bg-gradient-to-br from-purple-200 to-purple-300 border-purple-300",
          "text-purple-900",
          "shadow-purple-300"
        );
      case "dnp":
        return pill(
          "bg-gradient-to-br from-gray-200 to-gray-300 border-gray-300",
          "text-gray-900",
          "shadow-gray-300"
        );
      case "cnc":
        return pill(
          "bg-gradient-to-br from-sky-200 to-sky-300 border-sky-300",
          "text-sky-900",
          "shadow-sky-300"
        );
      default:
        return pill(
          "bg-gradient-to-br from-slate-200 to-slate-300 border-slate-300",
          "text-slate-900",
          "shadow-slate-300"
        );
    }
  };

  // Map a single mini disposition status to a colorful pill class
  const findMiniClass = (status) => {
    const c = statusGroups.connected;
    const n = statusGroups.notConnected;
    if (c.interested.hotLeads.includes(status))
      return groupCardClass("hotLeads");
    if (c.interested.warmLeads.includes(status))
      return groupCardClass("warmLeads");
    if (c.interested.followUp.includes(status))
      return groupCardClass("followUp");
    if (c.interested.converted.includes(status))
      return groupCardClass("converted");
    if (c.notInterested.closedLost.includes(status))
      return groupCardClass("closedLost");
    if (c.notInterested.futureProspect.includes(status))
      return groupCardClass("futureProspect");
    if (n.dnp.includes(status)) return groupCardClass("dnp");
    if (n.cnc.includes(status)) return groupCardClass("cnc");
    return groupCardClass("other");
  };

  const catTabClass = (key) => {
    const isActive = activeCategory === key;
    if (key === "connected") {
      return isActive
        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent shadow-sm"
        : "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 hover:from-emerald-100 hover:to-green-200";
    }
    return isActive
      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-transparent shadow-sm"
      : "bg-gradient-to-r from-rose-50 to-red-100 text-rose-800 border-rose-200 hover:from-rose-100 hover:to-red-200";
  };

  const renderLevel1 = () => (
    <div className="flex gap-3 mb-4">
      {[
        { key: "connected", label: "Connected" },
        { key: "notConnected", label: "Not Connected" },
      ].map((c) => (
        <button
          key={c.key}
          onClick={() => {
            setActiveCategory(c.key);
            setLevel(2);
            setActiveGroup("");
          }}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-150 ${catTabClass(
            c.key
          )}`}
        >
          <span className="mr-2">{c.label}</span>
          <span
            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
              c.key === "connected"
                ? activeCategory === "connected"
                  ? "bg-white/30 text-white"
                  : "bg-emerald-200 text-emerald-900"
                : activeCategory === "notConnected"
                ? "bg-white/30 text-white"
                : "bg-rose-200 text-rose-900"
            }`}
          >
            {c.key === "connected" ? connectedTotal : notConnectedTotal}
          </span>
        </button>
      ))}
    </div>
  );

  const renderLevel2 = () => {
    if (activeCategory === "connected") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[
            {
              key: "interested",
              label: "Interested",
              color: "green",
              groups: [
                { key: "hotLeads", label: "Hot Leads" },
                { key: "warmLeads", label: "Warm Leads" },
                { key: "followUp", label: "Follow Up" },
                { key: "converted", label: "Converted" },
              ],
            },
            {
              key: "notInterested",
              label: "Not Interested",
              color: "red",
              groups: [
                { key: "closedLost", label: "Closed / Lost" },
                { key: "futureProspect", label: "Future Prospect" },
              ],
            },
          ].map((section) => (
            <div
              key={section.key}
              className="col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2"
            >
              <h4 className="text-sm font-semibold mb-2 text-gray-800">
                {section.label}
              </h4>
              <div className="grid grid-cols-2 gap-5">
                {section.groups.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => {
                      setActiveGroup(g.key);
                      setLevel(3);
                    }}
                    className={groupCardClass(g.key)}
                  >
                    <div className="text-base font-semibold text-gray-800">
                      {g.label}
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900">
                      {getCount(statusGroups.connected[section.key][g.key])}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    // notConnected
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {[
          { key: "dnp", label: "DNP" },
          { key: "cnc", label: "CNC" },
          { key: "other", label: "Other" },
        ].map((g) => (
          <button
            key={g.key}
            onClick={() => {
              setActiveGroup(g.key);
              setLevel(3);
            }}
            className={groupCardClass(g.key)}
          >
            <div className="text-base font-semibold text-gray-800">
              {g.label}
            </div>
            <div className="text-4xl font-extrabold text-gray-900">
              {getCount(statusGroups.notConnected[g.key])}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderLevel3 = () => {
    const keys =
      activeCategory === "connected"
        ? statusGroups.connected[
            activeGroup === "hotLeads" ||
            activeGroup === "warmLeads" ||
            activeGroup === "followUp" ||
            activeGroup === "converted"
              ? "interested"
              : "notInterested"
          ][activeGroup] || []
        : statusGroups.notConnected[activeGroup] || [];

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50"
            onClick={() => setLevel(2)}
          >
            Back
          </button>
          <div className="text-sm text-gray-600">
            {activeCategory === "connected" ? "Connected" : "Not Connected"} •{" "}
            {activeGroup}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => fetchLeadDetails(k)}
              className={`${findMiniClass(k)} p-6`}
            >
              <div className="text-base font-semibold text-gray-800 break-all">
                {k.replace(/_/g, " ")}
              </div>
              <div className="text-4xl font-extrabold text-gray-900">
                {dialsLeads?.[k]?.count || 0}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-3">{renderLevel1()}</div>
      <div className="mt-2">
        {level === 1 && <div className="text-sm text-gray-500"></div>}
        {level === 2 && renderLevel2()}
        {level === 3 && renderLevel3()}
      </div>
    </div>
  );
};

export default LeadsDisposition;
