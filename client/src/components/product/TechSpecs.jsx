export default function TechSpecs({ specs = [], description }) {
  return (
    <div className="space-y-6">
      {/* Description complète */}
      {description && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Description</h3>
          <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
        </div>
      )}

      {/* Caractéristiques techniques */}
      {specs.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Caractéristiques techniques</h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-gray-700 w-2/5 border-r border-gray-200">
                      {spec.spec_key}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{spec.spec_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
