import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-md border border-gray-300 hover:border-dva-blue hover:text-dva-blue disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageNumbers[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1.5 text-sm rounded-md hover:bg-dva-blue-muted">1</button>
          {pageNumbers[0] > 2 && <span className="text-gray-400 px-1">…</span>}
        </>
      )}

      {pageNumbers.map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            n === page
              ? 'bg-dva-blue text-white font-semibold'
              : 'hover:bg-dva-blue-muted text-gray-700'
          }`}
        >
          {n}
        </button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < pages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < pages - 1 && <span className="text-gray-400 px-1">…</span>}
          <button onClick={() => onPageChange(pages)} className="px-3 py-1.5 text-sm rounded-md hover:bg-dva-blue-muted">{pages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-md border border-gray-300 hover:border-dva-blue hover:text-dva-blue disabled:opacity-40 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
