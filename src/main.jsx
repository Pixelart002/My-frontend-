import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const categories = [
  { number: '01 / Bath', title: 'Bath & body', text: 'Soft textures and considered essentials for your daily reset.', href: '/shop.html?category=bath', tone: 'dark' },
  { number: '02 / Home', title: 'Home comforts', text: 'Small details that bring warmth, order, and character home.', href: '/shop.html?category=home', tone: 'gold' },
  { number: '03 / New', title: 'New arrivals', text: 'Fresh finds, just in — selected for the way you live now.', href: '/shop.html?category=new', tone: 'dark' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="header">
    <a className="brand" href="/">LUVIIO</a>
    <nav className={`nav-links ${open ? 'is-open' : ''}`}>
      <a href="/shop.html">Shop</a><a href="#edit">The edit</a><a href="/about.html">Our story</a>
    </nav>
    <div className="header-actions"><a href="/shop.html" aria-label="Search"><Search size={18}/></a><a href="/cart.html" aria-label="Shopping bag"><ShoppingBag size={18}/></a><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X size={22}/> : <Menu size={22}/>}</button></div>
  </header>
}

function Footer() { return <footer className="footer"><div className="footer-grid"><div><div className="brand">LUVIIO</div><p>Curated essentials for a more considered everyday.</p></div><div><h4>Shop</h4><a href="/shop.html">All products</a><a href="/shop.html?category=new">New arrivals</a></div><div><h4>About</h4><a href="/about.html">Our story</a><a href="/shipping-policy.html">Shipping</a></div><div><h4>Help</h4><a href="mailto:support@luviio.in">Contact us</a><a href="/privacy.html">Privacy</a></div></div><div className="footer-bottom"><span>© 2026 Luviio</span><span>Made for the everyday.</span></div></footer> }

function App() {
  useEffect(() => { gsap.fromTo('.reveal', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .85, stagger: .12, ease: 'power3.out' }); gsap.utils.toArray('.category-card').forEach(card => gsap.fromTo(card, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .8, scrollTrigger: { trigger: card, start: 'top 85%' } })) }, [])
  return <><Header/><main><section className="hero"><div className="hero-copy"><p className="eyebrow reveal">Thoughtful things, beautifully made</p><h1 className="reveal">Make room for<br/><em>the good things.</em></h1><p className="hero-text reveal">Everyday pieces that make your space feel more like yours — from elevated bath essentials to objects worth keeping.</p><div className="hero-actions reveal"><a className="button button-primary" href="/shop.html">Explore the collection <ArrowRight size={16}/></a><a className="button button-quiet" href="#edit">What we sell</a></div></div><span className="scroll-note">Scroll to discover</span></section><section id="edit" className="edit section"><div className="section-intro"><p className="eyebrow">The Luviio edit</p><h2>Things you use.<br/><em>Things you love.</em></h2><p>A small, considered collection for slow mornings, clean spaces, and everyday rituals.</p></div><div className="category-grid">{categories.map(category => <a key={category.title} className={`category-card ${category.tone}`} href={category.href}><span>{category.number}</span><div><h3>{category.title}</h3><p>{category.text}</p><strong>Explore <ArrowRight size={15}/></strong></div></a>)}</div></section><section className="statement"><div><p className="eyebrow">A better everyday</p><h2>Good design,<br/>no fuss.</h2></div><p>We look for useful, beautiful products made to last. No clutter. No throwaway trends. Just things that earn their place.</p></section><section className="cta"><p className="eyebrow">Ready when you are</p><h2>Find your next<br/><em>favourite thing.</em></h2><a className="button button-primary" href="/shop.html">Shop everything <ArrowRight size={16}/></a></section></main><Footer/></>
}

createRoot(document.getElementById('root')).render(<App />)
