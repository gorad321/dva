export default function SortBar({ total, sort, onSortChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 mb-4">
      <p className="text-sm text-gray-600">
        <strong>{total}</strong> produit{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 hidden sm:block">Trier par :</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="input-dva text-sm py-1.5 w-auto"
        >
          <option value="name_asc">Nom A-Z</option>
          <option value="name_desc">Nom Z-A</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="newest">Nouveautés</option>
        </select>
      </div>
    </div>
  );
}
