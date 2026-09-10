import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RiStarFill, RiStarLine, RiSendPlaneLine } from '@remixicon/react';
import { reviewService } from '../services/reviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner, ErrorState } from '../components/ui/States';
import '../styles/reviews.css';

function Stars({ value = 0, interactive = false, onChange }) {
  return <div className="review-stars" aria-label={`${value} out of 5 stars`}>{[1,2,3,4,5].map((n) => interactive ? <button key={n} type="button" className="review-star-btn" aria-label={`${n} star${n>1?'s':''}`} onClick={()=>onChange(n)}>{n<=value?<RiStarFill size={20}/>:<RiStarLine size={20}/>}</button> : (n<=value?<RiStarFill key={n} size={16}/>:<RiStarLine key={n} size={16}/>))}</div>;
}

export default function ReviewsPage() {
  const [params] = useSearchParams(); const productId=params.get('product'); const {isAuthenticated}=useAuth(); const {toast}=useToast();
  const [reviews,setReviews]=useState(null); const [error,setError]=useState(''); const [rating,setRating]=useState(5); const [title,setTitle]=useState(''); const [body,setBody]=useState(''); const [saving,setSaving]=useState(false);
  const load=async()=>{if(!productId){setError('Choose a product to view reviews.');return}try{setError('');setReviews(await reviewService.listForProduct(productId))}catch(e){setError(e.message||'Unable to load reviews.')}};
  useEffect(()=>{load()},[productId]);
  const submit=async(e)=>{e.preventDefault();if(!isAuthenticated){toast.info('Please sign in to review a purchased product.');return}setSaving(true);try{await reviewService.create(productId,{rating,title:title.trim()||undefined,body:body.trim()});toast.success('Review submitted. It will appear after moderation.');setTitle('');setBody('');setRating(5);await load()}catch(e){toast.error(e.message||'Unable to submit review.')}finally{setSaving(false)}};
  if(error)return <div className="page container"><ErrorState message={error} onRetry={load}/></div>;
  if(!reviews)return <div className="page container"><Spinner label="Loading reviews…"/></div>;
  const items=Array.isArray(reviews)?reviews:(reviews?.items||reviews?.data||[]);
  return <div className="page container reviews-page"><div className="page-heading"><div><p className="eyebrow">Customer feedback</p><h1>Product reviews</h1><p>Verified-purchase reviews help other Luviio customers buy with confidence.</p></div><Link className="btn btn-quiet" to="/shop">Continue shopping</Link></div><div className="reviews-layout"><section className="reviews-list" aria-label="Published reviews">{items.length?items.map(review=><article className="review-card" key={review.id}><div className="review-card-head"><div><Stars value={Number(review.rating)||0}/><h2>{review.title||'Customer review'}</h2></div><span>{review.author_name||'Luviio customer'}</span></div><p>{review.body}</p><time dateTime={review.created_at}>{review.created_at?new Date(review.created_at).toLocaleDateString('en-IN'):''}</time></article>):<div className="empty-state"><h2>No published reviews yet</h2><p>Be the first verified customer to share your experience.</p></div>}</section><aside className="review-form-card"><p className="eyebrow">Have you bought it?</p><h2>Share your experience</h2><p>Only customers with a delivered order containing this product can submit a review.</p>{isAuthenticated?<form onSubmit={submit} className="review-form"><Stars value={rating} interactive onChange={setRating}/><label>Title<input maxLength="120" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What stood out?"/></label><label>Review<textarea required minLength="3" maxLength="2000" rows="6" value={body} onChange={e=>setBody(e.target.value)} placeholder="Tell other customers about the product."/></label><button className="btn" disabled={saving}><RiSendPlaneLine size={16}/>{saving?'Submitting…':'Submit review'}</button></form>:<Link className="btn" to="/login">Sign in to review</Link>}</aside></div></div>;
}
