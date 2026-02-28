import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { productsApi } from '../../api/productsApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import Button from '../common/Button';

function StarRating({ value, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(n)}
          className={!onChange ? 'cursor-default' : 'cursor-pointer'}>
          <Star className={`${sizeClass} ${n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ slug }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState({ reviews: [], stats: { avg_rating: 0, total: 0 } });
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    productsApi.getReviews(slug)
      .then((r) => setData(r.data))
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { toast.warning('Veuillez sélectionner une note'); return; }
    setSubmitting(true);
    try {
      await productsApi.createReview(slug, form);
      toast.success('Votre avis a été publié');
      setShowForm(false);
      setForm({ rating: 0, title: '', comment: '' });
      // Recharger les avis
      const r = await productsApi.getReviews(slug);
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          Avis clients ({data.stats?.total || 0})
        </h3>
        {user && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-outline text-sm">
            Écrire un avis
          </button>
        )}
      </div>

      {/* Résumé des notes */}
      {data.stats?.total > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-black text-gray-900">{Number(data.stats.avg_rating).toFixed(1)}</div>
            <StarRating value={Math.round(data.stats.avg_rating)} size="md" />
            <p className="text-xs text-gray-500 mt-1">{data.stats.total} avis</p>
          </div>
        </div>
      )}

      {/* Formulaire d'avis */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dva-blue-muted rounded-xl p-5 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Votre avis</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note *</label>
            <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} size="lg" />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Résumez votre expérience" maxLength={120} className="input-dva" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Décrivez votre expérience avec ce produit..." rows={4} maxLength={1000}
              className="input-dva resize-none" />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={submitting}>Publier mon avis</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </form>
      )}

      {/* Liste des avis */}
      {data.reviews?.length > 0 ? (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div key={review.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <StarRating value={review.rating} />
                    {review.is_verified === 1 && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <ThumbsUp className="w-3 h-3" /> Achat vérifié
                      </span>
                    )}
                  </div>
                  {review.title && <p className="font-semibold text-sm text-gray-800">{review.title}</p>}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>{review.first_name} {review.last_initial}</p>
                  <p>{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucun avis pour le moment. Soyez le premier !</p>
        </div>
      )}
    </div>
  );
}
