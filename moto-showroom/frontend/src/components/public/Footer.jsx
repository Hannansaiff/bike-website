import { Link } from 'react-router-dom';
import { Clock, Facebook, Instagram, Mail, MapPin, Music2, Phone, Twitter, Youtube } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import Logo from './Logo';

const SOCIAL = [
  ['facebook', Facebook, 'Facebook'],
  ['instagram', Instagram, 'Instagram'],
  ['youtube', Youtube, 'YouTube'],
  ['tiktok', Music2, 'TikTok'],
  ['twitter', Twitter, 'X / Twitter'],
];

export default function Footer() {
  const { content, settings, categories } = useSite();
  const contact = content?.contact || {};
  const social = content?.social || {};
  return (
    <footer className="mt-24 border-t border-white/10 bg-black">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo settings={settings} sub={settings?.tagline} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-fog">{content?.footer?.text}</p>
          <div className="mt-5 flex gap-1.5">
            {SOCIAL.filter(([k]) => social[k]).map(([k, Icon, label]) => (
              <a
                key={k}
                href={social[k]}
                target="_blank"
                rel="noreferrer"
                className="btn-icon border border-white/10 text-fog hover:border-white/30 hover:text-bone"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-bone">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-fog">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/categories/${c.slug}`} className="hover:text-bone">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-bone">Showroom</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-fog">
            <li><Link className="hover:text-bone" to="/book">Book a test ride</Link></li>
            <li><Link className="hover:text-bone" to="/track-booking">Track a booking</Link></li>
            <li><Link className="hover:text-bone" to="/compare">Compare bikes</Link></li>
            <li><Link className="hover:text-bone" to="/offers">Current offers</Link></li>
            <li><Link className="hover:text-bone" to="/about">About us</Link></li>
            <li><Link className="hover:text-bone" to="/admin/login">Staff login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-bone">Visit or call</h3>
          <ul className="mt-4 space-y-3 text-sm text-fog">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ignite" />{contact.address}</li>
            {(contact.phones || []).map((p) => (
              <li key={p} className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-ignite" />{p}</li>
            ))}
            {contact.email && (
              <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-ignite" /><a href={`mailto:${contact.email}`} className="hover:text-bone">{contact.email}</a></li>
            )}
            {(contact.hours || []).map((h) => (
              <li key={h.day} className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-ignite" /><span><span className="text-bone/80">{h.day}</span><br />{h.time}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {content?.footer?.copyright || settings?.business_name}</p>
          <p>Demo website: products, prices, offers and customer data are sample data.</p>
        </div>
      </div>
    </footer>
  );
}
