import { Car } from 'lucide-react';

export default function Compatibility({ compatibility = [] }) {
  if (!compatibility.length) return null;

  // Grouper par marque
  const grouped = compatibility.reduce((acc, item) => {
    if (!acc[item.make]) acc[item.make] = [];
    acc[item.make].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Car className="w-5 h-5 text-dva-blue" />
        Compatibilité véhicule
      </h3>
      <div className="space-y-4">
        {Object.entries(grouped).map(([make, items]) => (
          <div key={make} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-dva-blue px-4 py-2 text-white font-semibold text-sm">{make}</div>
            <div className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-gray-800">{item.model}</span>
                  {(item.year_from || item.year_to) && (
                    <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {item.year_from}{item.year_to && item.year_from !== item.year_to ? ` → ${item.year_to}` : ''}
                    </span>
                  )}
                  {item.engine && <span className="text-gray-600 text-xs">{item.engine}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
